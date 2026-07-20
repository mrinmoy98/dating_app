import * as mongoose from 'mongoose';

/**
 * A 1:1 chat message between two users who follow each other (friends).
 * `pair_key` is the two sorted user ids joined with "_" so a conversation is
 * cheap to query from either side.
 */
export const MessageSchema = new mongoose.Schema(
  {
    pair_key: { type: String, required: true, index: true },
    from: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

MessageSchema.index({ pair_key: 1, created_at: -1 });

export interface Message extends mongoose.Document {
  pair_key: string;
  from: any;
  to: any;
  text: string;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Stable conversation key for a pair of user ids. */
export function pairKey(a: string, b: string) {
  return [String(a), String(b)].sort().join('_');
}
