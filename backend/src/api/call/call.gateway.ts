import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { User } from '../../entity/user.entity';

/** One user waiting in the random-call queue. */
interface QueueEntry {
  socketId: string;
  userId: string;
  gender: string | null;
  pref: string[]; // genders they want to meet; [] = anyone
}

/**
 * WebRTC signaling + random matchmaking for 1:1 video calls.
 *
 * Flow:
 *  client connects to ws://<api>/call with { auth: { token } }  (user JWT)
 *  → emit 'join_queue' { pref: ['Female'] }
 *  → server pairs two compatible users → both get 'matched'
 *    { roomId, initiator, partner } (initiator creates the WebRTC offer)
 *  → peers exchange 'signal' { roomId, data } (offer / answer / ICE)
 *  → 'leave' (or disconnect / re-queue) ends the room; partner gets 'partner_left'
 */
@WebSocketGateway({ namespace: '/call', cors: { origin: true } })
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Namespace;
  private readonly logger = new Logger('CallGateway');

  private queue: QueueEntry[] = [];
  private rooms = new Map<string, [string, string]>(); // roomId → [socketId, socketId]
  private socketRoom = new Map<string, string>(); // socketId → roomId

  constructor(
    private readonly jwt: JwtService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token ??
        client.handshake.query?.token) as string;
      const payload = await this.jwt.verifyAsync(token);
      if (payload.role !== 'user') throw new Error('not a user token');
      client.data.userId = String(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.queue = this.queue.filter((q) => q.socketId !== client.id);
    this.closeRoomOf(client);
  }

  @SubscribeMessage('join_queue')
  async joinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { pref?: string[] },
  ) {
    const userId = client.data.userId as string;
    if (!userId) return;

    // Leaving a call to search again — close the old room, dedupe queue entries.
    this.closeRoomOf(client);
    this.queue = this.queue.filter(
      (q) => q.socketId !== client.id && q.userId !== userId,
    );

    const me = await this.userModel.findById(userId).lean();
    if (!me) return;

    const entry: QueueEntry = {
      socketId: client.id,
      userId,
      gender: me.gender ?? null,
      pref: body?.pref?.length ? body.pref : [],
    };

    const idx = this.queue.findIndex((c) => this.compatible(entry, c));
    if (idx === -1) {
      this.queue.push(entry);
      client.emit('waiting');
      return;
    }

    const partner = this.queue.splice(idx, 1)[0];
    const partnerSocket = this.getSocket(partner.socketId);
    if (!partnerSocket) {
      // Partner vanished between queueing and matching — keep waiting.
      this.queue.push(entry);
      client.emit('waiting');
      return;
    }

    const roomId = randomBytes(8).toString('hex');
    this.rooms.set(roomId, [client.id, partner.socketId]);
    this.socketRoom.set(client.id, roomId);
    this.socketRoom.set(partner.socketId, roomId);
    client.join(roomId);
    partnerSocket.join(roomId);

    const [myCard, partnerCard] = await Promise.all([
      this.card(userId),
      this.card(partner.userId),
    ]);
    // The newly-joined side creates the WebRTC offer.
    client.emit('matched', { roomId, initiator: true, partner: partnerCard });
    partnerSocket.emit('matched', { roomId, initiator: false, partner: myCard });
    this.logger.log(`matched ${userId} ↔ ${partner.userId} in ${roomId}`);
  }

  /** Relay WebRTC offers/answers/ICE candidates to the other peer in the room. */
  @SubscribeMessage('signal')
  relay(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; data: any },
  ) {
    if (!body?.roomId || this.socketRoom.get(client.id) !== body.roomId) return;
    client.to(body.roomId).emit('signal', { data: body.data });
  }

  @SubscribeMessage('leave')
  leave(@ConnectedSocket() client: Socket) {
    this.queue = this.queue.filter((q) => q.socketId !== client.id);
    this.closeRoomOf(client);
  }

  // ---- helpers ----

  private compatible(a: QueueEntry, b: QueueEntry) {
    if (a.userId === b.userId) return false;
    const aOk = !a.pref.length || (b.gender != null && a.pref.includes(b.gender));
    const bOk = !b.pref.length || (a.gender != null && b.pref.includes(a.gender));
    return aOk && bOk;
  }

  /** Tear down the caller's room (if any) and tell the partner. */
  private closeRoomOf(client: Socket) {
    const roomId = this.socketRoom.get(client.id);
    if (!roomId) return;
    const pair = this.rooms.get(roomId) ?? [];
    for (const sid of pair) {
      this.socketRoom.delete(sid);
      const s = this.getSocket(sid);
      s?.leave(roomId);
      if (sid !== client.id) s?.emit('partner_left');
    }
    this.rooms.delete(roomId);
  }

  private getSocket(id: string): Socket | undefined {
    return this.server.sockets.get(id);
  }

  private async card(userId: string) {
    const u = await this.userModel.findById(userId).lean();
    if (!u) return null;
    const primary = u.photos?.find((p: any) => p.is_primary) ?? u.photos?.[0];
    return {
      id: String(u._id),
      firstName: u.first_name,
      photoUrl: primary?.url ?? null,
    };
  }
}
