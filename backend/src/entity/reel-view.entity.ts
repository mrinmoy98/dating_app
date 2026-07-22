import * as mongoose from 'mongoose';

/**
 * One row per (user, reel) the first time someone watches it. The feed uses
 * these to stop showing the same reels over and over, and it makes the view
 * counter honest — re-watching your own feed no longer inflates it.
 */
export const ReelViewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    reel: { type: mongoose.SchemaTypes.ObjectId, ref: 'Reel', required: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

// A user watches a given reel once.
ReelViewSchema.index({ user: 1, reel: 1 }, { unique: true });

// Forget after two weeks so older reels can resurface instead of being
// permanently hidden, and the collection stays small.
ReelViewSchema.index({ created_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });

export interface ReelView extends mongoose.Document {
  user: any;
  reel: any;
  created_at: Date;
}
