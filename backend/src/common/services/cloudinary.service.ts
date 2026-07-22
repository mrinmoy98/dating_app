import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';

/** Where an asset lives inside the project folder. */
export type AssetKind = 'profile-images' | 'reels' | 'videos' | 'cms';

/**
 * Every upload goes to Cloudinary under a predictable, project-scoped path:
 *
 *   <root>/<owner-slug>/<kind>/<timestamp>_<app>.<ext>
 *   sn/mrinmoy123/profile-images/1784207246060_sangamX.png
 *   sn/mrinmoy123/reels/1784207246060_sangamX.mp4
 *
 * `root` is CLOUDINARY_ROOT_FOLDER (default "sn") so one Cloudinary account can
 * host several projects side by side.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly root = process.env.CLOUDINARY_ROOT_FOLDER || 'sn';
  private readonly tag = process.env.CLOUDINARY_ASSET_TAG || 'sangamX';
  readonly enabled: boolean;

  constructor() {
    const url = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    this.enabled = !!(url || (cloudName && apiKey && apiSecret));

    if (this.enabled && cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
        ...(process.env.CLOUDINARY_SECURE_DIST
          ? { secure_distribution: process.env.CLOUDINARY_SECURE_DIST, private_cdn: true }
          : {}),
      });
    } else if (this.enabled) {
      cloudinary.config({ secure: true });
    } else {
      this.logger.error(
        'Cloudinary is not configured — every upload will fail. Set CLOUDINARY_* in backend/.env',
      );
    }
  }

  folderFor(slug: string, kind: AssetKind) {
    return `${this.root}/${this.slugify(slug)}/${kind}`;
  }

  fileNameFor() {
    return `${Date.now()}_${this.tag}`;
  }

  async upload(
    buffer: Buffer,
    opts: { slug: string; kind: AssetKind; video?: boolean },
  ): Promise<{ url: string; publicId: string }> {
    const folder = this.folderFor(opts.slug, opts.kind);
    const publicId = this.fileNameFor();

    const res = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: opts.video ? 'video' : 'image',
          overwrite: false,
          use_filename: false,
          unique_filename: false,
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
          resolve(result);
        },
      );
      stream.end(buffer);
    }).catch((e) => {
      this.logger.error(`Cloudinary upload failed: ${e?.message}`);
      throw new InternalServerErrorException('Image upload failed. Please try again.');
    });

    return { url: res.secure_url, publicId: res.public_id };
  }


  async moveIntoUserFolder(
    url: string,
    slug: string,
    kind: AssetKind,
    video = false,
  ): Promise<string> {
    if (!this.enabled || !url) return url;
    const publicId = this.publicIdFromUrl(url);
    if (!publicId || !publicId.includes('/pending-')) return url;

    const target = `${this.folderFor(slug, kind)}/${publicId.split('/').pop()}`;
    try {
      const res = await cloudinary.uploader.rename(publicId, target, {
        resource_type: video ? 'video' : 'image',
        overwrite: false,
      });
      return res.secure_url;
    } catch (e: any) {
      this.logger.warn(`Could not move ${publicId} → ${target}: ${e?.message}`);
      return url;
    }
  }

  async destroy(publicId: string, video = false) {
    if (!this.enabled || !publicId) return;
    await cloudinary.uploader
      .destroy(publicId, { resource_type: video ? 'video' : 'image' })
      .catch((e) => this.logger.warn(`Cloudinary delete failed for ${publicId}: ${e?.message}`));
  }

  publicIdFromUrl(url?: string | null): string | null {
    if (!url || !url.includes('/upload/')) return null;
    const after = url.split('/upload/')[1] ?? '';
    const withoutVersion = after.replace(/^v\d+\//, '');
    return withoutVersion.replace(/\.[a-z0-9]+$/i, '') || null;
  }

  slugify(value: string) {
    return (
      String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'user'
    );
  }
}
