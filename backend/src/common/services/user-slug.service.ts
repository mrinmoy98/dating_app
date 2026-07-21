import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User } from '../../entity/user.entity';


@Injectable()
export class UserSlugService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) { }

  async ensure(userId: string): Promise<string> {
    if (!isValidObjectId(userId)) return 'user';
    const user = await this.userModel.findById(userId).select('slug first_name last_name phone');
    if (!user) return 'user';
    if (user.slug) return user.slug;

    const slug = await this.generate(
      [user.first_name, user.last_name].filter(Boolean).join(' ') || user.phone,
    );
    await this.userModel.updateOne({ _id: userId }, { $set: { slug } });
    return slug;
  }

  async generate(source: string): Promise<string> {
    const base =
      String(source || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'user';

    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}${i + 1}`;
      const taken = await this.userModel.exists({ slug: candidate });
      if (!taken) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}
