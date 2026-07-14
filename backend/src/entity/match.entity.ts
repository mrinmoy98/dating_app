import * as mongoose from 'mongoose';

export const MatchSchema = new mongoose.Schema(
  {
    users: {
      type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
      required: true,
    },
    pair_key: { type: String, required: true, unique: true },
    last_message_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Match extends mongoose.Document {
  users: any[];
  pair_key: string;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
}


