import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from '../entity/banner.entity';
import { Language } from '../entity/language.entity';
import { Page } from '../entity/page.entity';
import { Setting } from '../entity/setting.entity';
import {
  CreateBannerDto,
  CreateLanguageDto,
  CreatePageDto,
  UpdateBannerDto,
  UpdateLanguageDto,
  UpdatePageDto,
  UpdateSettingsDto,
} from './dto/cms.dto';

@Injectable()
export class CmsService implements OnModuleInit {
  constructor(
    @InjectModel('Banner') private readonly bannerModel: Model<Banner>,
    @InjectModel('Page') private readonly pageModel: Model<Page>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    @InjectModel('Language') private readonly languageModel: Model<Language>,
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

    // Seed a starter language list if empty.
    if ((await this.languageModel.countDocuments()) === 0) {
      const langs = [
        'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati',
        'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese', 'Nepali',
      ];
      await this.languageModel.insertMany(
        langs.map((title, i) => ({ title, sequence: i, is_active: true, status: true })),
      );
    }
  }

  // ===================== Languages =====================
  listLanguages() {
    return this.languageModel.find().sort({ sequence: 1, title: 1 }).lean();
  }
  activeLanguages() {
    return this.languageModel.find({ is_active: true }).sort({ sequence: 1, title: 1 }).lean();
  }
  createLanguage(dto: CreateLanguageDto) {
    const isActive = dto.is_active !== false;
    return this.languageModel.create({
      title: dto.title.trim(),
      sequence: dto.sequence ?? 0,
      is_active: isActive,
      status: isActive,
    });
  }
  async updateLanguage(id: string, dto: UpdateLanguageDto) {
    const set: Record<string, unknown> = { ...dto };
    if (dto.is_active !== undefined) set.status = dto.is_active; // keep status in sync
    const lang = await this.languageModel.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!lang) throw new NotFoundException('Language not found');
    return lang;
  }
  async deleteLanguage(id: string) {
    const res = await this.languageModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Language not found');
    return { deleted: true, id };
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
