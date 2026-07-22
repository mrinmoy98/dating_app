import {
  BadRequestException,
  Controller,
  Post,
  Query,
  ServiceUnavailableException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { createHash } from 'crypto';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssetKind, CloudinaryService } from '../../common/services/cloudinary.service';
import { UserSlugService } from '../../common/services/user-slug.service';

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|quicktime)$/i;

@ApiTags('User Profile')
@ApiBearerAuth('JWT')
@Controller('api/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly slugs: UserSlugService,
  ) {}

  @Post('photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload up to 6 profile photos → <root>/<user-slug>/profile-images/…',
  })
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_EXT.test(file.originalname)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { sub: string },
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const slug = await this.ownerSlug(user);
    const urls = await Promise.all(
      files.map((f) => this.store(f, { slug, kind: 'profile-images' })),
    );
    return { urls };
  }

  @Post('video')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: ['reels', 'videos'],
    description: 'reels → <root>/<slug>/reels/…, videos → <root>/<slug>/videos/… (intro video)',
  })
  @ApiOperation({ summary: 'Upload one video (field "file"); returns its public URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 60 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!VIDEO_EXT.test(file.originalname)) {
          return cb(new BadRequestException('Only video files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
    @Query('kind') kind: string,
  ) {
    if (!file) throw new BadRequestException('No video uploaded');
    const slug = await this.ownerSlug(user);
    const url = await this.store(file, {
      slug,
      kind: kind === 'reels' ? 'reels' : 'videos',
      video: true,
    });
    return { url };
  }

  /**
   * Folder owner. Logged-in users get their own slug; during registration the
   * account doesn't exist yet, so media goes to a temporary `pending-<hash>`
   * folder and `register()` moves it into the user's folder afterwards.
   */
  private async ownerSlug(user: { sub?: string; phone?: string }): Promise<string> {
    if (user?.sub) return this.slugs.ensure(user.sub);
    const seed = user?.phone ?? 'anonymous';
    return `pending-${createHash('sha1').update(seed).digest('hex').slice(0, 10)}`;
  }

  /** All media lives on Cloudinary — nothing is ever written to disk. */
  private async store(
    file: Express.Multer.File,
    opts: { slug: string; kind: AssetKind; video?: boolean },
  ): Promise<string> {
    if (!this.cloudinary.enabled) {
      throw new ServiceUnavailableException(
        'Media storage is not configured. Set CLOUDINARY_* in backend/.env',
      );
    }
    const { url } = await this.cloudinary.upload(file.buffer, opts);
    return url;
  }
}
