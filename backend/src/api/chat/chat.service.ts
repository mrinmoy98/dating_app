import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService, ResourceType } from '../../common/services/cloudinary.service';
import { RealtimeService } from '../../common/services/realtime.service';
import { UserSlugService } from '../../common/services/user-slug.service';
import { Message, MessageType, pairKey, shapeMessage } from '../../entity/message.entity';
import { User } from '../../entity/user.entity';
import { NotificationService } from '../notification/notification.service';
import { SocialService } from '../social/social.service';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|mkv|avi)$/i;
const AUDIO_EXT = /\.(m4a|mp3|aac|wav|ogg|opus|caf|amr|3gpp?)$/i;

/** Everything a chat message needs, whichever transport it arrived on. */
export interface OutgoingMessage {
  to: string;
  text?: string;
  type?: MessageType;
  attachment?: {
    url: string;
    name?: string;
    mime?: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
  } | null;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly social: SocialService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationService,
    private readonly cloudinary: CloudinaryService,
    private readonly slugs: UserSlugService,
  ) {}

  /**
   * Persist a message, fan it out to both sides, and fall back to a push
   * notification when the recipient isn't connected.
   *
   * `delivered` is decided here: online recipient → the socket hand-off counts
   * as delivery (double tick), offline → stays false (single tick) until they
   * reconnect and `markDelivered` runs.
   */
  async send(from: string, body: OutgoingMessage) {
    const to = String(body?.to || '');
    if (!to) throw new BadRequestException('Recipient is required');

    const text = (body.text ?? '').trim().slice(0, 2000);
    const type: MessageType = body.type ?? (body.attachment ? 'file' : 'text');
    if (type === 'text' && !text) throw new BadRequestException('Message is empty');
    if (type !== 'text' && !body.attachment?.url) {
      throw new BadRequestException('Attachment is missing');
    }

    if (!(await this.social.areFriends(from, to))) {
      throw new ForbiddenException('You can only chat with people who follow you back');
    }

    const delivered = this.realtime.isOnline(to);
    const saved = await this.messageModel.create({
      pair_key: pairKey(from, to),
      from,
      to,
      text,
      type,
      attachment: body.attachment
        ? {
            url: body.attachment.url,
            name: body.attachment.name ?? '',
            mime: body.attachment.mime ?? '',
            size: body.attachment.size ?? 0,
            duration: body.attachment.duration ?? 0,
            width: body.attachment.width ?? 0,
            height: body.attachment.height ?? 0,
          }
        : null,
      delivered,
    });

    const payload = shapeMessage(saved);
    this.realtime.emitToPair(from, to, 'chat_new', payload);

    if (!delivered) {
      const sender = await this.userModel.findById(from).lean();
      await this.notifications.push(
        to,
        from,
        'message',
        `${sender?.first_name ?? 'Someone'} sent you ${this.preview(type)}`,
      );
    }
    return payload;
  }

  /**
   * Called when a user connects: everything queued for them is now on their
   * device, so each sender's single tick becomes a double tick.
   */
  async markDelivered(userId: string) {
    const pending = await this.messageModel
      .find({ to: userId, delivered: false })
      .select('_id from')
      .lean();
    if (!pending.length) return;

    await this.messageModel.updateMany(
      { to: userId, delivered: false },
      { $set: { delivered: true } },
    );

    // One event per sender carrying just their own message ids.
    const bySender = new Map<string, string[]>();
    for (const m of pending) {
      const key = String(m.from);
      if (!bySender.has(key)) bySender.set(key, []);
      bySender.get(key)!.push(String(m._id));
    }
    for (const [sender, ids] of bySender) {
      this.realtime.emitTo(sender, 'chat_delivered', { by: userId, messageIds: ids });
    }
  }

  /** Recipient opened the thread — blue double ticks for the other side. */
  async markRead(me: string, withUser: string) {
    const unread = await this.messageModel
      .find({ pair_key: pairKey(me, withUser), to: me, read: false })
      .select('_id')
      .lean();
    if (!unread.length) return { updated: 0 };

    await this.messageModel.updateMany(
      { pair_key: pairKey(me, withUser), to: me, read: false },
      { $set: { read: true, delivered: true } },
    );
    const messageIds = unread.map((m) => String(m._id));
    this.realtime.emitTo(withUser, 'chat_read', { by: me, messageIds });
    return { updated: messageIds.length };
  }

  /**
   * Delete one of your own messages. The bubble disappears for both sides and
   * any Cloudinary asset it carried is cleaned up — nobody keeps a copy.
   */
  async remove(me: string, messageId: string) {
    const msg = await this.messageModel.findById(messageId).lean();
    if (!msg) throw new NotFoundException('Message not found');
    if (String(msg.from) !== String(me)) {
      throw new ForbiddenException('You can only delete messages you sent');
    }

    await this.messageModel.deleteOne({ _id: messageId });

    if (msg.attachment?.url) {
      const publicId = this.cloudinary.publicIdFromUrl(msg.attachment.url);
      if (publicId) {
        await this.cloudinary
          .destroy(publicId, this.resourceTypeFor(msg.type))
          .catch(() => {});
      }
    }

    const payload = { id: String(msg._id), from: String(msg.from), to: String(msg.to) };
    this.realtime.emitToPair(String(msg.from), String(msg.to), 'chat_deleted', payload);
    return { deleted: true, ...payload };
  }

  /** Upload one chat attachment and describe it the way the client needs it. */
  async storeAttachment(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!this.cloudinary.enabled) {
      throw new ServiceUnavailableException(
        'Media storage is not configured. Set CLOUDINARY_* in backend/.env',
      );
    }

    const type = this.classify(file);
    const resourceType = this.resourceTypeFor(type);

    const slug = await this.slugs.ensure(userId);
    const res = await this.cloudinary.upload(file.buffer, {
      slug,
      kind: 'chat',
      resourceType,
      extension: (file.originalname.split('.').pop() || '').toLowerCase(),
    });

    return {
      type,
      attachment: {
        url: res.url,
        name: file.originalname,
        mime: file.mimetype,
        size: file.size,
        duration: Math.round(res.duration ?? 0),
        width: res.width ?? 0,
        height: res.height ?? 0,
      },
    };
  }

  /** Cloudinary bucket for a message type — audio rides on 'video', documents on 'raw'. */
  private resourceTypeFor(type: MessageType): ResourceType {
    if (type === 'image') return 'image';
    if (type === 'file') return 'raw';
    return 'video';
  }

  /** Extension first (RN sends generic mime types for recordings), mime as fallback. */
  private classify(file: Express.Multer.File): MessageType {
    const name = file.originalname || '';
    if (IMAGE_EXT.test(name)) return 'image';
    if (VIDEO_EXT.test(name)) return 'video';
    if (AUDIO_EXT.test(name)) return 'audio';

    const mime = file.mimetype || '';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'file';
  }

  private preview(type: MessageType) {
    switch (type) {
      case 'image':
        return 'a photo';
      case 'video':
        return 'a video';
      case 'audio':
        return 'a voice message';
      case 'file':
        return 'a file';
      default:
        return 'a message';
    }
  }
}
