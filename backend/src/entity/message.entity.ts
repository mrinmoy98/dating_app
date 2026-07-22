import * as mongoose from 'mongoose';

/** What a message carries. `text` is the plain chat bubble; the rest have an attachment. */
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

export const MESSAGE_TYPES: MessageType[] = ['text', 'image', 'video', 'audio', 'file'];

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, default: '' },
    mime: { type: String, default: '' },
    size: { type: Number, default: 0 },
    /** Seconds — voice notes and videos. */
    duration: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false },
);

export const MessageSchema = new mongoose.Schema(
  {
    pair_key: { type: String, required: true, index: true },
    from: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '' },
    type: { type: String, enum: MESSAGE_TYPES, default: 'text' },
    attachment: { type: AttachmentSchema, default: null },
    /** Recipient's device has the message (they were online, or came online later). */
    delivered: { type: Boolean, default: false },
    /** Recipient opened the conversation. */
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

MessageSchema.index({ pair_key: 1, created_at: -1 });
// Fast lookup of "everything still undelivered for this user" on reconnect.
MessageSchema.index({ to: 1, delivered: 1 });

export interface MessageAttachment {
  url: string;
  name: string;
  mime: string;
  size: number;
  duration: number;
  width: number;
  height: number;
}

export interface Message extends mongoose.Document {
  pair_key: string;
  from: any;
  to: any;
  text: string;
  type: MessageType;
  attachment: MessageAttachment | null;
  delivered: boolean;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Stable conversation key for a pair of user ids. */
export function pairKey(a: string, b: string) {
  return [String(a), String(b)].sort().join('_');
}

/**
 * Wire shape shared by REST history and the realtime `chat_new` event, so the
 * client renders a message the same way whichever path it arrived on.
 */
export function shapeMessage(m: any) {
  return {
    id: String(m._id),
    from: String(m.from),
    to: String(m.to),
    text: m.text ?? '',
    type: (m.type ?? 'text') as MessageType,
    attachment: m.attachment ?? null,
    delivered: !!m.delivered,
    read: !!m.read,
    created_at: m.created_at,
  };
}
