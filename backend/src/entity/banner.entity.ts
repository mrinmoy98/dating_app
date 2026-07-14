import * as mongoose from 'mongoose';

/** Promotional banner shown in the mobile app (home/discover). */
export const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    image_url: { type: String, required: true },
    link_url: { type: String, default: '' }, // optional deep-link / web URL
    position: { type: Number, default: 0 }, // display order (asc)
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Banner extends mongoose.Document {
  title: string;
  image_url: string;
  link_url: string;
  position: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
