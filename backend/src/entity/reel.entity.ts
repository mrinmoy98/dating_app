import * as mongoose from 'mongoose';

/**
 * A short video posted by a user. Shown in the Reels feed and as a grid on the
 * poster's profile.
 */
export const ReelSchema = new mongoose.Schema(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    video_url: { type: String, required: true },
    thumbnail_url: { type: String, default: null },
    caption: { type: String, default: '' },
    music: { type: String, default: '' },
    likes: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'removed'], default: 'active', index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

// Feed + profile grid are both "newest first".
ReelSchema.index({ status: 1, created_at: -1 });
ReelSchema.index({ user: 1, created_at: -1 });

export interface Reel extends mongoose.Document {
  user: any;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  music: string;
  likes: any[];
  likes_count: number;
  comments_count: number;
  views: number;
  status: 'active' | 'removed';
  created_at: Date;
  updated_at: Date;
}
