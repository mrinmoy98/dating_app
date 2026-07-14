import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow } from '../../entity/follow.entity';
import { Match } from '../../entity/match.entity';
import { User } from '../../entity/user.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    @InjectModel('Match') private readonly matchModel: Model<Match>,
  ) {}

  async getProfile(viewerId: string, targetId: string) {
    const user = await this.userModel.findById(targetId);
    if (!user) throw new NotFoundException('User not found');

    const [followersCount, followingCount, isFollowing, matched] = await Promise.all([
      this.followModel.countDocuments({ following: targetId }),
      this.followModel.countDocuments({ follower: targetId }),
      this.followModel.exists({ follower: viewerId, following: targetId }),
      this.matchModel.exists({ users: { $all: [viewerId, targetId] } }),
    ]);

    return {
      ...this.shape(user),
      followers_count: followersCount,
      following_count: followingCount,
      is_following: !!isFollowing,
      is_matched: !!matched,
      is_me: String(viewerId) === String(targetId),
    };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException("You can't follow yourself");
    const target = await this.userModel.findById(targetId);
    if (!target) throw new NotFoundException('User not found');
    await this.followModel.updateOne(
      { follower: userId, following: targetId },
      { follower: userId, following: targetId },
      { upsert: true },
    );
    return { following: true };
  }

  async unfollow(userId: string, targetId: string) {
    await this.followModel.deleteOne({ follower: userId, following: targetId });
    return { following: false };
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
