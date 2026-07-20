import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow } from '../../entity/follow.entity';
import { Match } from '../../entity/match.entity';
import { User } from '../../entity/user.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    @InjectModel('Match') private readonly matchModel: Model<Match>,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Two users are "friends" when they follow EACH OTHER.
   * Only friends may chat or video-call.
   */
  async areFriends(a: string, b: string): Promise<boolean> {
    if (String(a) === String(b)) return false;
    const [x, y] = await Promise.all([
      this.followModel.exists({ follower: a, following: b }),
      this.followModel.exists({ follower: b, following: a }),
    ]);
    return !!x && !!y;
  }

  /** Mutual follows — the people you can chat / call. */
  async friends(userId: string) {
    const [iFollow, followMe] = await Promise.all([
      this.followModel.find({ follower: userId }).select('following').lean(),
      this.followModel.find({ following: userId }).select('follower').lean(),
    ]);
    const followingIds = new Set(iFollow.map((f) => String(f.following)));
    const mutualIds = followMe
      .map((f) => String(f.follower))
      .filter((id) => followingIds.has(id));
    if (!mutualIds.length) return [];
    const users = await this.userModel.find({ _id: { $in: mutualIds } });
    return users.map((u) => this.shape(u)).filter(Boolean);
  }

  /** Newest members you haven't followed yet. */
  async newUsers(userId: string, limit = 30) {
    const iFollow = await this.followModel.find({ follower: userId }).select('following').lean();
    const exclude = [userId, ...iFollow.map((f) => String(f.following))];
    const users = await this.userModel
      .find({
        _id: { $nin: exclude },
        status: 'active',
        is_profile_complete: true,
      })
      .sort({ created_at: -1 })
      .limit(limit);
    return users.map((u) => this.shape(u)).filter(Boolean);
  }

  /** People who share at least one interest with you. */
  async byInterest(userId: string, limit = 30) {
    const me = await this.userModel.findById(userId).lean();
    if (!me) throw new NotFoundException('User not found');
    const interests = me.interests ?? [];
    if (!interests.length) return [];

    const iFollow = await this.followModel.find({ follower: userId }).select('following').lean();
    const exclude = [userId, ...iFollow.map((f) => String(f.following))];

    const users = await this.userModel
      .find({
        _id: { $nin: exclude },
        status: 'active',
        is_profile_complete: true,
        interests: { $in: interests },
      })
      .limit(limit);

    // Most shared interests first.
    return users
      .map((u) => ({
        user: u,
        shared: (u.interests ?? []).filter((i) => interests.includes(i)),
      }))
      .sort((a, b) => b.shared.length - a.shared.length)
      .map(({ user, shared }) => ({ ...this.shape(user), shared_interests: shared }));
  }

  async getProfile(viewerId: string, targetId: string) {
    const user = await this.userModel.findById(targetId);
    if (!user) throw new NotFoundException('User not found');

    const [followersCount, followingCount, isFollowing, followsMe, matched] = await Promise.all([
      this.followModel.countDocuments({ following: targetId }),
      this.followModel.countDocuments({ follower: targetId }),
      this.followModel.exists({ follower: viewerId, following: targetId }),
      this.followModel.exists({ follower: targetId, following: viewerId }),
      this.matchModel.exists({ users: { $all: [viewerId, targetId] } }),
    ]);

    return {
      ...this.shape(user),
      followers_count: followersCount,
      following_count: followingCount,
      is_following: !!isFollowing,
      follows_me: !!followsMe,
      // Mutual follow → chat & video call unlocked.
      is_friend: !!isFollowing && !!followsMe,
      is_matched: !!matched,
      is_me: String(viewerId) === String(targetId),
    };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException("You can't follow yourself");
    const [target, me] = await Promise.all([
      this.userModel.findById(targetId),
      this.userModel.findById(userId),
    ]);
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.followModel.findOne({ follower: userId, following: targetId });
    await this.followModel.updateOne(
      { follower: userId, following: targetId },
      { follower: userId, following: targetId },
      { upsert: true },
    );

    if (!existing) {
      const name = me?.first_name ?? 'Someone';
      // If they already followed us, this follow makes it mutual → friends.
      const theyFollowMe = await this.followModel.exists({
        follower: targetId,
        following: userId,
      });
      if (theyFollowMe) {
        await this.notifications.push(
          targetId,
          userId,
          'follow_back',
          `${name} followed you back — you can now chat & call!`,
        );
        await this.notifications.push(
          userId,
          targetId,
          'follow_back',
          `You and ${target.first_name ?? 'someone'} follow each other — chat & call unlocked!`,
        );
      } else {
        await this.notifications.push(targetId, userId, 'follow', `${name} started following you`);
      }
    }

    return { following: true, is_friend: await this.areFriends(userId, targetId) };
  }

  async unfollow(userId: string, targetId: string) {
    await this.followModel.deleteOne({ follower: userId, following: targetId });
    return { following: false, is_friend: false };
  }

  /** Remove someone from MY followers (they stop following me). */
  async removeFollower(userId: string, followerId: string) {
    await this.followModel.deleteOne({ follower: followerId, following: userId });
    return { removed: true, id: followerId };
  }

  async following(userId: string) {
    const rows = await this.followModel
      .find({ follower: userId })
      .sort({ created_at: -1 })
      .populate('following');
    return rows.map((r) => this.shape(r.following as unknown as User)).filter(Boolean);
  }

  async followers(userId: string) {
    const rows = await this.followModel
      .find({ following: userId })
      .sort({ created_at: -1 })
      .populate('follower');
    return rows.map((r) => this.shape(r.follower as unknown as User)).filter(Boolean);
  }

  private shape(u: User | null) {
    if (!u) return null;
    const primary = u.photos?.find((p) => p.is_primary) ?? u.photos?.[0];
    return {
      id: String(u._id),
      firstName: u.first_name,
      lastName: u.last_name,
      age: this.calcAge(u.dob),
      photoUrl: primary?.url ?? null,
      photos: (u.photos ?? []).map((p) => p.url),
      location: u.location,
      bio: u.bio,
      occupation: u.occupation,
      education: u.education,
      interests: u.interests ?? [],
      gender: u.gender,
      religion: u.religion,
      height_label: u.height_label,
      relationship_goal: u.relationship_goal,
      verified: !!(u.phone_verified && u.email_verified),
      // ---- full profile details (shown on the profile screen) ----
      height_cm: u.height_cm,
      weight_kg: u.weight_kg,
      relationship_status: u.relationship_status,
      mother_tongue: u.mother_tongue,
      other_languages: u.other_languages ?? [],
      smoking: u.smoking,
      drinking: u.drinking,
      diet: u.diet,
      blood_group: u.blood_group,
      complexion: u.complexion,
      health_info: u.health_info,
      city: u.address?.city ?? null,
      state: u.address?.state ?? null,
      country: u.address?.country ?? null,
      video_url: u.video_url,
    };
  }

  private calcAge(dob: Date | null): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }
}
