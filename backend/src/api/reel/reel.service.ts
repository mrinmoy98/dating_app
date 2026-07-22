import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { Follow } from '../../entity/follow.entity';
import { ReelView } from '../../entity/reel-view.entity';
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
    @InjectModel('ReelView') private readonly viewModel: Model<ReelView>,
    private readonly notifications: NotificationService,
    private readonly cloudinary: CloudinaryService,
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

  /**
   * Ranked suggestion feed, Instagram style.
   *
   * Rules that shape the order:
   *  - your own reels never appear (you already see them on your profile);
   *  - reels you have already watched are held back and only used to pad the
   *    end when there isn't enough fresh material;
   *  - newer reels rank far above older ones;
   *  - creators you follow get a boost, but they don't monopolise the feed;
   *  - popular reels (likes per view) get a smaller boost;
   *  - a random jitter keeps every pull-to-refresh different.
   */
  async feed(userId: string, limit = 30) {
    const take = Math.min(limit, 100);

    const [iFollow, seenRows, candidates] = await Promise.all([
      this.followModel.find({ follower: userId }).select('following').lean(),
      this.viewModel.find({ user: userId }).select('reel').lean(),
      this.reelModel
        .find({ status: 'active', user: { $ne: userId } })
        .sort({ created_at: -1 })
        .limit(take * 8) // wide pool so the ranking has room to work
        .populate('user'),
    ]);

    const following = new Set(iFollow.map((f) => String(f.following)));
    const seen = new Set(seenRows.map((v) => String(v.reel)));

    const scored = candidates
      .map((reel) => {
        const shaped = this.shape(reel, userId);
        if (!shaped) return null;
        return {
          reel: shaped,
          seen: seen.has(shaped.id),
          score: this.rank(reel, following.has(String(reel.user?._id ?? reel.user))),
        };
      })
      .filter(Boolean) as { reel: any; seen: boolean; score: number }[];

    const fresh = scored.filter((r) => !r.seen).sort((a, b) => b.score - a.score);
    // Re-runs only fill the gap, and the oldest-watched come back first.
    const rewatch = scored.filter((r) => r.seen).sort((a, b) => b.score - a.score);

    return [...fresh, ...rewatch].slice(0, take).map((r) => r.reel);
  }

  /**
   * Feed score for one reel. Recency dominates, then who posted it, then how
   * well it is doing — plus noise so two refreshes never look identical.
   */
  private rank(reel: Reel, isFollowing: boolean): number {
    const ageHours = Math.max(
      0,
      (Date.now() - new Date(reel.created_at).getTime()) / (1000 * 60 * 60),
    );

    // 1.0 for a brand-new reel, ~0.5 after a day, ~0.2 after three days.
    const freshness = 1 / (1 + ageHours / 24);

    // People you follow matter, but not enough to bury everyone else.
    const followBoost = isFollowing ? 0.35 : 0;

    // Likes per view, damped so a reel with 1 view and 1 like can't win.
    const views = reel.views ?? 0;
    const likes = reel.likes_count ?? 0;
    const engagement = likes / (views + 10);

    // Small popularity nudge that flattens out for very large numbers.
    const popularity = Math.log10(likes + 1) / 10;

    // Keeps the order fresh on every refresh.
    const jitter = Math.random() * 0.25;

    return freshness * 1.0 + followBoost + engagement * 0.3 + popularity + jitter;
  }

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

  /**
   * Record that this user watched the reel. Only the first watch counts, so the
   * number can't be inflated by scrolling past it again — and the feed uses the
   * same rows to avoid repeating what you've already seen.
   */
  async view(userId: string, reelId: string) {
    const existing = await this.viewModel.findOne({ user: userId, reel: reelId }).lean();
    if (existing) return { success: true, counted: false };

    try {
      await this.viewModel.create({ user: userId, reel: reelId });
    } catch (e: any) {
      if (e?.code === 11000) return { success: true, counted: false }; // raced
      throw e;
    }
    await this.reelModel.updateOne({ _id: reelId }, { $inc: { views: 1 } });
    return { success: true, counted: true };
  }

  async remove(userId: string, reelId: string) {
    const reel = await this.reelModel.findById(reelId);
    if (!reel) throw new NotFoundException('Reel not found');
    if (String(reel.user) !== String(userId)) {
      throw new ForbiddenException('You can only delete your own reels');
    }
    reel.status = 'removed';
    await reel.save();

    // Free the storage and the watch history; the row stays for the record.
    const publicId = this.cloudinary.publicIdFromUrl(reel.video_url);
    if (publicId) await this.cloudinary.destroy(publicId, true);
    await this.viewModel.deleteMany({ reel: reelId });

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
