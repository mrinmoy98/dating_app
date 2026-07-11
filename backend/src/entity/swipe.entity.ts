import * as mongoose from 'mongoose';

/**
 * A single like/pass action from one user on another. One row per (from, to)
 * pair — re-swiping updates the same row.
 */
export const SwipeSchema = new mongoose.Schema(
  {
    from: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

SwipeSchema.index({ from: 1, to: 1 }, { unique: true });

export interface Swipe extends mongoose.Document {
  from: any;
  to: any;
  action: 'like' | 'pass';
  created_at: Date;
  updated_at: Date;
}
