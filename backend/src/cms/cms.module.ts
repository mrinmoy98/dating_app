import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerSchema } from '../entity/banner.entity';
import { PageSchema } from '../entity/page.entity';
import { SettingSchema } from '../entity/setting.entity';
import { AdminCmsController } from './admin-cms.controller';
import { CmsService } from './cms.service';
import { PublicCmsController } from './public-cms.controller';

/**
 * Content management: banners, CMS pages (privacy/terms/about), and global
 * site settings. Admin CRUD under /admin/cms/*, public reads under /api/cms/*.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Banner', schema: BannerSchema },
      { name: 'Page', schema: PageSchema },
      { name: 'Setting', schema: SettingSchema },
    ]),
  ],
  controllers: [AdminCmsController, PublicCmsController],
  providers: [CmsService],
})
export class CmsModule {}
