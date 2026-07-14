import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CmsService } from './cms.service';

/** Read-only CMS content for the mobile app (no auth). */
@ApiTags('CMS (public)')
@Controller('api/cms')
export class PublicCmsController {
  constructor(private readonly cms: CmsService) {}

  @Public()
  @Get('banners')
  @ApiOperation({ summary: 'Active banners for the app' })
  banners() {
    return this.cms.activeBanners();
  }

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Global site settings' })
  settings() {
    return this.cms.getSettings();
  }

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'A published page (e.g. privacy-policy, terms-of-service)' })
  page(@Param('slug') slug: string) {
    return this.cms.getPublishedPage(slug);
  }
}
