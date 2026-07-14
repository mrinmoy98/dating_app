import * as mongoose from 'mongoose';

/** A follow edge: `follower` follows `following`. One row per pair. */
export const FollowSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    following: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

export interface Follow extends mongoose.Document {
  follower: any;
  following: any;
  created_at: Date;
  updated_at: Date;
}
