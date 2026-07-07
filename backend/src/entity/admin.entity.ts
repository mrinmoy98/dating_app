import * as mongoose from 'mongoose';

/**
 * Platform administrator (dashboard). Separate collection from dating `users`
 * because admins log in with email + password, while end users log in with
 * phone + OTP. A `superadmin` is seeded on first boot from env.
 */
export type AdminRole = 'admin' | 'superadmin';

export const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Admin extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}
