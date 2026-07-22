import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CmsService } from './cms.service';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
import {
  CreateBannerDto,
  CreateLanguageDto,
  CreatePageDto,
  UpdateBannerDto,
  UpdateLanguageDto,
  UpdatePageDto,
  UpdateSettingsDto,
} from './dto/cms.dto';

@ApiTags('Admin CMS')
@ApiBearerAuth('JWT')
@Controller('admin/cms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminCmsController {
  constructor(
    private readonly cms: CmsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image (field "file"); returns its public URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
      fileFilter: (_req, file, cb) =>
        IMAGE_EXT.test(file.originalname)
          ? cb(null, true)
          : cb(new BadRequestException('Only image files are allowed'), false),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!this.cloudinary.enabled) {
      throw new ServiceUnavailableException(
        'Media storage is not configured. Set CLOUDINARY_* in backend/.env',
      );
    }
    const { url } = await this.cloudinary.upload(file.buffer, { slug: 'admin', kind: 'cms' });
    return { url };
  }

  @Get('banners')
  @ApiOperation({ summary: 'List all banners' })
  listBanners() {
    return this.cms.listBanners();
  }
  @Post('banners')
  @ApiOperation({ summary: 'Create a banner' })
  createBanner(@Body() dto: CreateBannerDto) {
    return this.cms.createBanner(dto);
  }
  @Patch('banners/:id')
  @ApiOperation({ summary: 'Update a banner' })
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.cms.updateBanner(id, dto);
  }
  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a banner' })
  deleteBanner(@Param('id') id: string) {
    return this.cms.deleteBanner(id);
  }

  // ---- Pages ----
  @Get('pages')
  @ApiOperation({ summary: 'List all CMS pages' })
  listPages() {
    return this.cms.listPages();
  }
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get a page by slug' })
  getPage(@Param('slug') slug: string) {
    return this.cms.getPage(slug);
  }
  @Post('pages')
  @ApiOperation({ summary: 'Create a CMS page' })
  createPage(@Body() dto: CreatePageDto) {
    return this.cms.createPage(dto);
  }
  @Patch('pages/:id')
  @ApiOperation({ summary: 'Update a CMS page' })
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.cms.updatePage(id, dto);
  }
  @Delete('pages/:id')
  @ApiOperation({ summary: 'Delete a CMS page' })
  deletePage(@Param('id') id: string) {
    return this.cms.deletePage(id);
  }

  // ---- Languages ----
  @Get('languages')
  @ApiOperation({ summary: 'List all languages' })
  listLanguages() {
    return this.cms.listLanguages();
  }
  @Post('languages')
  @ApiOperation({ summary: 'Create a language' })
  createLanguage(@Body() dto: CreateLanguageDto) {
    return this.cms.createLanguage(dto);
  }
  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  updateLanguage(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.cms.updateLanguage(id, dto);
  }
  @Delete('languages/:id')
  @ApiOperation({ summary: 'Delete a language' })
  deleteLanguage(@Param('id') id: string) {
    return this.cms.deleteLanguage(id);
  }

  // ---- Settings ----
  @Get('settings')
  @ApiOperation({ summary: 'Get global site settings' })
  getSettings() {
    return this.cms.getSettings();
  }
  @Put('settings')
  @ApiOperation({ summary: 'Update global site settings' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.cms.updateSettings(dto);
  }
}
