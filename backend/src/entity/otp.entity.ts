import * as mongoose from 'mongoose';

/**
 * One-time password issued during phone/email verification. We store only a
 * bcrypt HASH of the code, never the plaintext. A TTL index auto-deletes
 * expired documents. One active OTP per identifier (phone number OR email),
 * upserted on each send.
 */
export const OtpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, index: true, trim: true }, // phone (E.164) or email
    channel: { type: String, enum: ['phone', 'email'], required: true },
    code_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
    attempts: { type: Number, default: 0 }, // wrong-code attempts, capped for brute-force protection
    consumed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

// Auto-remove documents once expires_at passes.
OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export interface Otp extends mongoose.Document {
  identifier: string;
  channel: 'phone' | 'email';
  code_hash: string;
  expires_at: Date;
  attempts: number;
  consumed: boolean;
  created_at: Date;
  updated_at: Date;
}
