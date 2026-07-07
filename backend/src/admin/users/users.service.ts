import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from '../../entity/user.entity';
import { ListUsersDto } from './dto/users.dto';

@Injectable()
export class AdminUsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  /** Paginated, filterable list of dating-app users. */
  async list(query: ListUsersDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<User> = {};
    if (query.status) filter.status = query.status;
    if (query.gender) filter.gender = query.gender;
    if (query.search) {
      const rx = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ phone: rx }, { first_name: rx }, { location: rx }];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-__v')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getOne(id: string) {
    const user = await this.userModel.findById(id).select('-__v').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setStatus(id: string, status: 'active' | 'banned') {
    const user = await this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select('-__v')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string) {
    const res = await this.userModel.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('User not found');
    return { deleted: true, id };
  }

  /** Dashboard summary counters. */
  async stats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, active, banned, complete, newToday, genderAgg] = await Promise.all([
      this.userModel.countDocuments({}),
      this.userModel.countDocuments({ status: 'active' }),
      this.userModel.countDocuments({ status: 'banned' }),
      this.userModel.countDocuments({ is_profile_complete: true }),
      this.userModel.countDocuments({ created_at: { $gte: startOfToday } }),
      this.userModel.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
    ]);

    const byGender = { Male: 0, Female: 0, Other: 0, Unspecified: 0 };
    for (const g of genderAgg) {
      const key = g._id ?? 'Unspecified';
      byGender[key] = g.count;
    }

    return {
      totalUsers: total,
      activeUsers: active,
      bannedUsers: banned,
      completedProfiles: complete,
      newToday,
      byGender,
    };
  }

  private escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
