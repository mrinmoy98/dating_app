import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow } from '../../entity/follow.entity';
import { Reel } from '../../entity/reel.entity';
import { User } from '../../entity/user.entity';
import { NotificationService } from '../notification/notification.service';
import { CreateReelDto } from './dto/reel.dto';

@Injectable()
export class ReelService {
  constructor(
    @InjectModel('Reel') private readonly reelModel: Model<Reel>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    private readonly notifications: NotificationService,
  ) {}

  async create(userId: string, dto: CreateReelDto) {
    const reel = await this.reelModel.create({
      user: userId,
      video_url: dto.video_url,
      thumbnail_url: dto.thumbnail_url ?? null,
      caption: dto.caption ?? '',
      music: dto.music ?? 'original audio',
    });
    await reel.populate('user');
    return this.shape(reel, userId);
  }

  /** Main feed — people you follow first, then everyone else. */
  async feed(userId: string, limit = 30) {
    const iFollow = await this.followModel.find({ follower: userId }).select('following').lean();
    const followingIds = iFollow.map((f) => String(f.following));

    const rows = await this.reelModel
      .find({ status: 'active' })
      .sort({ created_at: -1 })
      .limit(Math.min(limit, 100))
      .populate('user');

    const shaped = rows.map((r) => this.shape(r, userId)).filter(Boolean) as any[];
    // Followed creators bubble to the top, order preserved inside each group.
    return [
      ...shaped.filter((r) => followingIds.includes(r.user.id)),
      ...shaped.filter((r) => !followingIds.includes(r.user.id)),
    ];
  }

  /** Every reel posted by one user — powers the profile grid. */
  async byUser(viewerId: string, targetId: string, limit = 60) {
    const rows = await this.reelModel
      .find({ user: targetId, status: 'active' })
      .sort({ created_at: -1 })
      .limit(Math.min(limit, 200))
      .populate('user');
    return rows.map((r) => this.shape(r, viewerId)).filter(Boolean);
  }

  countFor(userId: string) {
    return this.reelModel.countDocuments({ user: userId, status: 'active' });
  }

  /**
   * Toggle like; notifies the owner the first time someone likes it.
   * $addToSet / $pull keep the count exact even if the user double-taps.
   */
  async toggleLike(userId: string, reelId: string) {
    const reel = await this.reelModel.findById(reelId).select('likes user status');
    if (!reel || reel.status !== 'active') throw new NotFoundException('Reel not found');

    const wasLiked = (reel.likes ?? []).some((id) => String(id) === String(userId));
    const updated = await this.reelModel.findByIdAndUpdate(
      reelId,
      wasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
      { new: true, select: 'likes user' },
    );
    const likesCount = updated?.likes?.length ?? 0;
    await this.reelModel.updateOne({ _id: reelId }, { $set: { likes_count: likesCount } });

    if (!wasLiked) {
      const me = await this.userModel.findById(userId).lean();
      await this.notifications.push(
        String(reel.user),
        userId,
        'reel_like',
        `${me?.first_name ?? 'Someone'} liked your reel`,
      );
    }
    return { liked: !wasLiked, likes_count: likesCount };
  }

  async view(reelId: string) {
    await this.reelModel.updateOne({ _id: reelId }, { $inc: { views: 1 } });
    return { success: true };
  }

  async remove(userId: string, reelId: string) {
    const reel = await this.reelModel.findById(reelId);
    if (!reel) throw new NotFoundException('Reel not found');
    if (String(reel.user) !== String(userId)) {
      throw new ForbiddenException('You can only delete your own reels');
    }
    reel.status = 'removed';
    await reel.save();
    return { deleted: true, id: reelId };
  }

  private shape(reel: Reel, viewerId: string) {
    const u: any = reel.user;
    if (!u) return null;
    const primary = u.photos?.find((p: any) => p.is_primary) ?? u.photos?.[0];
    return {
      id: String(reel._id),
      video_url: reel.video_url,
      thumbnail_url: reel.thumbnail_url,
      caption: reel.caption,
      music: reel.music || 'original audio',
      likes_count: reel.likes_count ?? 0,
      comments_count: reel.comments_count ?? 0,
      views: reel.views ?? 0,
      liked: (reel.likes ?? []).some((id) => String(id) === String(viewerId)),
      created_at: reel.created_at,
      user: {
        id: String(u._id),
        firstName: u.first_name ?? null,
        lastName: u.last_name ?? null,
        photoUrl: primary?.url ?? null,
        verified: !!(u.phone_verified && u.email_verified),
        is_me: String(u._id) === String(viewerId),
      },
    };
  }
}
