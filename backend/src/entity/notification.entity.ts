import * as mongoose from 'mongoose';

export type NotificationType =
  | 'follow'
  | 'follow_back'
  | 'like'
  | 'match'
  | 'message'
  | 'call'
  | 'reel_like';

export const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    from: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['follow', 'follow_back', 'like', 'match', 'message', 'call', 'reel_like'],
      required: true,
    },
    text: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

NotificationSchema.index({ user: 1, created_at: -1 });

export interface Notification extends mongoose.Document {
  user: any;
  from: any;
  type: NotificationType;
  text: string;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}
