import * as mongoose from 'mongoose';

/**
 * Global site settings — a single document keyed by 'global'. Holds branding,
 * contact info, social links, store URLs, and platform toggles.
 */
export const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    site_name: { type: String, default: 'Dating App' },
    tagline: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    support_email: { type: String, default: '' },
    support_phone: { type: String, default: '' },
    address: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    android_app_url: { type: String, default: '' },
    ios_app_url: { type: String, default: '' },
    min_age: { type: Number, default: 18 },
    maintenance_mode: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface Setting extends mongoose.Document {
  key: string;
  site_name: string;
  tagline: string;
  logo_url: string;
  support_email: string;
  support_phone: string;
  address: string;
  facebook: string;
  instagram: string;
  twitter: string;
  android_app_url: string;
  ios_app_url: string;
  min_age: number;
  maintenance_mode: boolean;
  created_at: Date;
  updated_at: Date;
}
