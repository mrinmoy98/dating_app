import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationType } from '../../entity/notification.entity';
import { User } from '../../entity/user.entity';

@Injectable()
export class NotificationService {
  private emitter: ((userId: string, event: string, payload: any) => void) | null = null;

  constructor(
    @InjectModel('Notification') private readonly model: Model<Notification>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  registerEmitter(fn: (userId: string, event: string, payload: any) => void) {
    this.emitter = fn;
  }

  async push(userId: string, fromId: string | null, type: NotificationType, text: string) {
    if (fromId && String(userId) === String(fromId)) return;
    const row = await this.model.create({ user: userId, from: fromId, type, text });
    const payload = await this.shape(row);
    this.emitter?.(String(userId), 'notification', payload);
    return payload;
  }

  async list(userId: string, limit = 50) {
    const rows = await this.model
      .find({ user: userId })
      .sort({ created_at: -1 })
      .limit(Math.min(limit, 100))
      .populate('from');
    return Promise.all(rows.map((r) => this.shape(r)));
  }

  unreadCount(userId: string) {
    return this.model.countDocuments({ user: userId, read: false });
  }

  async markAllRead(userId: string) {
    await this.model.updateMany({ user: userId, read: false }, { $set: { read: true } });
    // Clears the header badge on every device this user is signed in on.
    this.emitter?.(String(userId), 'notifications_read', { count: 0 });
    return { success: true };
  }

  async markRead(userId: string, id: string) {
    await this.model.updateOne({ _id: id, user: userId }, { $set: { read: true } });
    return { success: true };
  }

  async remove(userId: string, id: string) {
    await this.model.deleteOne({ _id: id, user: userId });
    return { deleted: true, id };
  }

  private async shape(row: Notification) {
    let from: any = row.from;
    if (from && !from.first_name && from._id) from = await this.userModel.findById(from).lean();
    else if (from && typeof from === 'object' && !from.photos && from._id === undefined) from = null;

    const primary = from?.photos?.find((p: any) => p.is_primary) ?? from?.photos?.[0];
    return {
      id: String(row._id),
      type: row.type,
      text: row.text,
      read: row.read,
      created_at: row.created_at,
      from: from
        ? {
            id: String(from._id),
            firstName: from.first_name ?? null,
            lastName: from.last_name ?? null,
            photoUrl: primary?.url ?? null,
          }
        : null,
    };
  }
}
