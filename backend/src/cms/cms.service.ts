import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from '../entity/banner.entity';
import { Page } from '../entity/page.entity';
import { Setting } from '../entity/setting.entity';
import {
  CreateBannerDto,
  CreatePageDto,
  UpdateBannerDto,
  UpdatePageDto,
  UpdateSettingsDto,
} from './dto/cms.dto';

@Injectable()
export class CmsService implements OnModuleInit {
  constructor(
    @InjectModel('Banner') private readonly bannerModel: Model<Banner>,
    @InjectModel('Page') private readonly pageModel: Model<Page>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
  ) {}

  /** Seed the global settings row + default legal pages on first boot. */
  async onModuleInit() {
    await this.settingModel.updateOne(
      { key: 'global' },
      { $setOnInsert: { key: 'global' } },
      { upsert: true },
    );
    const defaults = [
      { slug: 'privacy-policy', title: 'Privacy Policy' },
      { slug: 'terms-of-service', title: 'Terms of Service' },
      { slug: 'about-us', title: 'About Us' },
    ];
    for (const p of defaults) {
      await this.pageModel.updateOne(
        { slug: p.slug },
        { $setOnInsert: { ...p, content: '', is_published: true } },
        { upsert: true },
      );
    }
  }

  // ===================== Banners =====================
  listBanners() {
    return this.bannerModel.find().sort({ position: 1, created_at: -1 }).lean();
  }
  activeBanners() {
    return this.bannerModel.find({ is_active: true }).sort({ position: 1 }).lean();
  }
  createBanner(dto: CreateBannerDto) {
    return this.bannerModel.create(dto);
  }
  async updateBanner(id: string, dto: UpdateBannerDto) {
    const b = await this.bannerModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }
  async deleteBanner(id: string) {
    const res = await this.bannerModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Banner not found');
    return { deleted: true, id };
  }

  // ===================== Pages =====================
  listPages() {
    return this.pageModel.find().sort({ title: 1 }).lean();
  }
  async getPage(slug: string) {
    const page = await this.pageModel.findOne({ slug: slug.toLowerCase() }).lean();
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }
  async getPublishedPage(slug: string) {
    const page = await this.pageModel
      .findOne({ slug: slug.toLowerCase(), is_published: true })
      .lean();
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }
  async createPage(dto: CreatePageDto) {
    const slug = dto.slug.toLowerCase().trim();
    const exists = await this.pageModel.findOne({ slug });
    if (exists) throw new NotFoundException('A page with this slug already exists');
    return this.pageModel.create({ ...dto, slug });
  }
  async updatePage(id: string, dto: UpdatePageDto) {
    const p = await this.pageModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!p) throw new NotFoundException('Page not found');
    return p;
  }
  async deletePage(id: string) {
    const res = await this.pageModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Page not found');
    return { deleted: true, id };
  }

  // ===================== Settings =====================
  async getSettings() {
    return this.settingModel.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { key: 'global' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  async updateSettings(dto: UpdateSettingsDto) {
    return this.settingModel.findOneAndUpdate(
      { key: 'global' },
      { $set: dto },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}
