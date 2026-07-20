import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match } from '../../entity/match.entity';
import { Swipe } from '../../entity/swipe.entity';
import { User } from '../../entity/user.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel('Swipe') private readonly swipeModel: Model<Swipe>,
    @InjectModel('Match') private readonly matchModel: Model<Match>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly notifications: NotificationService,
  ) {}


  async swipe(userId: string, targetId: string, action: 'like' | 'pass') {
    if (userId === targetId) {
      throw new BadRequestException("You can't swipe on yourself");
    }
    const target = await this.userModel.findById(targetId);
    if (!target) throw new NotFoundException('User not found');

    await this.swipeModel.findOneAndUpdate(
      { from: userId, to: targetId },
      { from: userId, to: targetId, action },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (action !== 'like') return { matched: false };

    const me = await this.userModel.findById(userId);
    const myName = me?.first_name ?? 'Someone';

    // Did the target already like us back?
    const reciprocal = await this.swipeModel.findOne({
      from: targetId,
      to: userId,
      action: 'like',
    });
    if (!reciprocal) {
      await this.notifications.push(targetId, userId, 'like', `${myName} liked your profile`);
      return { matched: false };
    }

    const pair = [String(userId), String(targetId)].sort();
    const match = await this.matchModel.findOneAndUpdate(
      { pair_key: pair.join('_') },
      { pair_key: pair.join('_'), users: pair },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await Promise.all([
      this.notifications.push(targetId, userId, 'match', `You matched with ${myName}! 💕`),
      this.notifications.push(
        userId,
        targetId,
        'match',
        `You matched with ${target.first_name ?? 'someone'}! 💕`,
      ),
    ]);

    return { matched: true, match: this.toCard(target, String(match._id)) };
  }

  /** People I liked (swiped right on). */
  async myLikes(userId: string) {
    const rows = await this.swipeModel
      .find({ from: userId, action: 'like' })
      .sort({ created_at: -1 })
      .populate('to');
    return rows.map((r) => this.toCard(r.to as unknown as User, '')).filter(Boolean);
  }

  /** People who liked me (and we haven't matched yet). */
  async likedMe(userId: string) {
    const rows = await this.swipeModel
      .find({ to: userId, action: 'like' })
      .sort({ created_at: -1 })
      .populate('from');
    return rows.map((r) => this.toCard(r.from as unknown as User, '')).filter(Boolean);
  }

  async getMatches(userId: string) {
    const matches = await this.matchModel
      .find({ users: userId })
      .sort({ created_at: -1 })
      .populate('users');

    return matches
      .map((m) => {
        const other = (m.users as unknown as User[]).find(
          (u) => String(u._id) !== String(userId),
        );
        if (!other) return null;
        return this.toCard(other, String(m._id), m.created_at);
      })
      .filter(Boolean);
  }

  private toCard(user: User, matchId: string, matchedOn?: Date) {
    const primary = user.photos?.find((p) => p.is_primary) ?? user.photos?.[0];
    return {
      matchId,
      id: String(user._id),
      firstName: user.first_name,
      lastName: user.last_name,
      age: this.calcAge(user.dob),
      photoUrl: primary?.url ?? null,
      location: user.location,
      interests: user.interests ?? [],
      matchedOn: matchedOn ?? new Date(),
      verified: !!(user.phone_verified && user.email_verified),
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
