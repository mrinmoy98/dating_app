import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const UPLOAD_DIR = './public/uploads';
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|quicktime)$/i;

function storageFor() {
  return diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const name = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname)}`;
      cb(null, name);
    },
  });
}

function publicUrl(req: Request, filename: string) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

@ApiTags('User Profile')
@ApiBearerAuth('JWT')
@Controller('api/upload')
@UseGuards(JwtAuthGuard) // any valid JWT (registration token during onboarding, or auth token)
export class UploadController {
  @Post('photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload up to 6 profile photos; returns their public URLs' })
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      storage: storageFor(),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB per file
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_EXT.test(file.originalname)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPhotos(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const urls = files.map((f) => publicUrl(req, f.filename));
    return { urls };
  }

  @Post('video')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload one intro video (field "file"); returns its public URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageFor(),
      limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB
      fileFilter: (_req, file, cb) => {
        if (!VIDEO_EXT.test(file.originalname)) {
          return cb(new BadRequestException('Only video files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No video uploaded');
    return { url: publicUrl(req, file.filename) };
  }
}
