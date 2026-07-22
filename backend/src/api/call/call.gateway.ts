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
import { RealtimeService } from '../../common/services/realtime.service';
import { MessageType } from '../../entity/message.entity';
import { User } from '../../entity/user.entity';
import { ChatService } from '../chat/chat.service';
import { NotificationService } from '../notification/notification.service';
import { SocialService } from '../social/social.service';


@WebSocketGateway({ namespace: '/rt', cors: { origin: true } })
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Namespace;
  private readonly logger = new Logger('RealtimeGateway');

  private online = new Map<string, Set<string>>();
  private calls = new Map<string, { a: string; b: string }>();

  constructor(
    private readonly jwt: JwtService,
    private readonly social: SocialService,
    private readonly notifications: NotificationService,
    private readonly chat: ChatService,
    private readonly realtime: RealtimeService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {
    const emit = (userId: string, event: string, payload: any) => {
      this.server?.to(`user:${userId}`).emit(event, payload);
    };
    this.notifications.registerEmitter(emit);
    // Lets REST controllers (multipart chat upload) push events and read presence.
    this.realtime.register(emit, (userId) => this.online.has(userId));
  }

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token ??
        client.handshake.query?.token) as string;
      const payload = await this.jwt.verifyAsync(token);
      if (payload.role !== 'user') throw new Error('not a user token');
      const userId = String(payload.sub);
      client.data.userId = userId;

      if (!this.online.has(userId)) this.online.set(userId, new Set());
      this.online.get(userId)!.add(client.id);
      client.join(`user:${userId}`);

      client.emit('ready', { userId });
      this.broadcastPresence(userId, true);
      // Anything queued while they were away is now on their device → double tick.
      await this.chat.markDelivered(userId).catch(() => {});
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;
    const set = this.online.get(userId);
    set?.delete(client.id);
    if (set && set.size === 0) {
      this.online.delete(userId);
      this.broadcastPresence(userId, false);
    }
    for (const [callId, pair] of this.calls) {
      if (pair.a === userId || pair.b === userId) {
        const other = pair.a === userId ? pair.b : pair.a;
        this.server.to(`user:${other}`).emit('call_end', { callId, reason: 'disconnected' });
        this.calls.delete(callId);
      }
    }
  }

  /**
   * Plain text, or a message whose attachment was already uploaded via
   * `POST /api/chat/send`-style multipart and is being referenced by URL.
   */
  @SubscribeMessage('chat_send')
  async chatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { to: string; text?: string; type?: MessageType; attachment?: any },
  ) {
    const from = client.data.userId as string;
    if (!from || !body?.to) return;
    try {
      await this.chat.send(from, body);
    } catch (e: any) {
      client.emit('error_msg', { message: e?.message ?? 'Could not send message' });
    }
  }

  @SubscribeMessage('chat_delete')
  async chatDelete(@ConnectedSocket() client: Socket, @MessageBody() body: { id: string }) {
    const me = client.data.userId as string;
    if (!me || !body?.id) return;
    try {
      await this.chat.remove(me, body.id);
    } catch (e: any) {
      client.emit('error_msg', { message: e?.message ?? 'Could not delete message' });
    }
  }

  /** Initial online state when a client opens a thread (events cover the rest). */
  @SubscribeMessage('presence_query')
  presenceQuery(@ConnectedSocket() client: Socket, @MessageBody() body: { userIds: string[] }) {
    const ids = Array.isArray(body?.userIds) ? body.userIds : [];
    for (const id of ids) {
      client.emit('presence', { userId: String(id), online: this.online.has(String(id)) });
    }
  }

  @SubscribeMessage('chat_typing')
  typing(@ConnectedSocket() client: Socket, @MessageBody() body: { to: string; typing: boolean }) {
    const from = client.data.userId as string;
    if (!from || !body?.to) return;
    this.server.to(`user:${body.to}`).emit('chat_typing', { from, typing: !!body.typing });
  }

  @SubscribeMessage('chat_read')
  async read(@ConnectedSocket() client: Socket, @MessageBody() body: { withUser: string }) {
    const me = client.data.userId as string;
    if (!me || !body?.withUser) return;
    await this.chat.markRead(me, body.withUser);
  }

  @SubscribeMessage('call_invite')
  async invite(@ConnectedSocket() client: Socket, @MessageBody() body: { to: string }) {
    const from = client.data.userId as string;
    if (!from || !body?.to) return;

    if (!(await this.social.areFriends(from, body.to))) {
      client.emit('error_msg', { message: 'You can only call people who follow you back.' });
      return;
    } 
    if (!this.online.has(body.to)) {
      client.emit('call_unavailable', { reason: 'User is offline' });
      return;
    }

    const callId = randomBytes(8).toString('hex');
    this.calls.set(callId, { a: from, b: body.to });
    client.join(`call:${callId}`);

    const caller = await this.card(from);
    this.server.to(`user:${body.to}`).emit('call_ring', { callId, from: caller });
    client.emit('call_ringing', { callId });
    await this.notifications.push(
      body.to,
      from,
      'call',
      `${caller?.firstName ?? 'Someone'} is calling you`,
    );
    this.logger.log(`call ${callId}: ${from} → ${body.to}`);
  }

  @SubscribeMessage('call_accept')
  async accept(@ConnectedSocket() client: Socket, @MessageBody() body: { callId: string }) {
    const me = client.data.userId as string;
    const pair = this.calls.get(body?.callId);
    if (!pair || (pair.a !== me && pair.b !== me)) return;

    client.join(`call:${body.callId}`);
    const other = pair.a === me ? pair.b : pair.a;
    const [meCard, otherCard] = await Promise.all([this.card(me), this.card(other)]);
    this.server.to(`user:${other}`).emit('call_accepted', { callId: body.callId, partner: meCard });
    client.emit('call_accepted', { callId: body.callId, partner: otherCard });
  }

  @SubscribeMessage('call_reject')
  reject(@ConnectedSocket() client: Socket, @MessageBody() body: { callId: string }) {
    const me = client.data.userId as string;
    const pair = this.calls.get(body?.callId);
    if (!pair) return;
    const other = pair.a === me ? pair.b : pair.a;
    this.server.to(`user:${other}`).emit('call_end', { callId: body.callId, reason: 'declined' });
    this.calls.delete(body.callId);
  }

  @SubscribeMessage('call_frame')
  frame(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId: string; data: string; muted?: boolean },
  ) {
    const me = client.data.userId as string;
    const pair = this.calls.get(body?.callId);
    if (!pair || (pair.a !== me && pair.b !== me)) return;
    const other = pair.a === me ? pair.b : pair.a;
    this.server.to(`user:${other}`).emit('call_frame', {
      callId: body.callId,
      data: body.data,
      muted: !!body.muted,
    });
  }

  @SubscribeMessage('call_end')
  end(@ConnectedSocket() client: Socket, @MessageBody() body: { callId: string }) {
    const me = client.data.userId as string;
    const pair = this.calls.get(body?.callId);
    if (!pair) return;
    const other = pair.a === me ? pair.b : pair.a;
    this.server.to(`user:${other}`).emit('call_end', { callId: body.callId, reason: 'ended' });
    this.calls.delete(body.callId);
  }

  private async broadcastPresence(userId: string, isOnline: boolean) {
    try {
      const friends = await this.social.friends(userId);
      for (const f of friends) {
        this.server.to(`user:${(f as any).id}`).emit('presence', { userId, online: isOnline });
      }
    } catch {
    }
  }

  private async card(userId: string) {
    const u = await this.userModel.findById(userId).lean();
    if (!u) return null;
    const primary = u.photos?.find((p: any) => p.is_primary) ?? u.photos?.[0];
    return {
      id: String(u._id),
      firstName: u.first_name,
      lastName: u.last_name,
      photoUrl: primary?.url ?? null,
    };
  }
}
