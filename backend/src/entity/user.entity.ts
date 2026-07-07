import * as mongoose from 'mongoose';

/**
 * Dating-app end user. Identity is phone-based (OTP login) — there is NO
 * password and NO email for regular users. Every onboarding field the mobile
 * app collects has its own typed field here (no JSON blobs).
 */

export type Gender = 'Male' | 'Female' | 'Other';
export type Habit = 'Regularly' | 'Sometimes' | 'Never';
export type UserStatus = 'active' | 'banned';

/** A single profile photo (face-reveal step uploads up to 4). */
const PhotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    position: { type: Number, default: 0 }, // 0..3 ordering on the profile
    is_primary: { type: Boolean, default: false },
  },
  { _id: false },
);

export const UserSchema = new mongoose.Schema(
  {
    // ---- identity ----
    phone: { type: String, required: true, unique: true, trim: true }, // E.164, e.g. +919476448744
    phone_verified: { type: Boolean, default: false },
    email: { type: String, default: null, lowercase: true, trim: true },
    email_verified: { type: Boolean, default: false },

    // ---- basic profile (QuickIntro step) ----
    first_name: { type: String, default: null, trim: true },
    dob: { type: Date, default: null }, // birth date; age is computed from this
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },

    // ---- location (QuickIntro step) ----
    location: { type: String, default: null }, // free-text city/area the user typed
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // ---- physical (Height step) ----
    height_cm: { type: Number, default: null },
    height_label: { type: String, default: null }, // e.g. `5'0" (152 cm)`

    // ---- lifestyle / preference steps ----
    relationship_status: { type: String, default: null }, // Single, Divorced, ...
    religion: { type: String, default: null },
    mother_tongue: { type: String, default: null },
    other_languages: { type: [String], default: [] },
    smoking: { type: String, enum: ['Regularly', 'Sometimes', 'Never'], default: null },
    drinking: { type: String, enum: ['Regularly', 'Sometimes', 'Never'], default: null },
    relationship_goal: { type: String, default: null },

    // ---- media ----
    photos: { type: [PhotoSchema], default: [] },
    video_url: { type: String, default: null }, // optional intro video



    // ---- account state ----
    role: { type: String, default: 'user' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    is_profile_complete: { type: Boolean, default: false },
    last_active_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface UserPhoto {
  url: string;
  position: number;
  is_primary: boolean;
}

export interface User extends mongoose.Document {
  phone: string;
  phone_verified: boolean;
  email: string | null;
  email_verified: boolean;
  first_name: string | null;
  dob: Date | null;
  gender: Gender | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  height_cm: number | null;
  height_label: string | null;
  relationship_status: string | null;
  religion: string | null;
  mother_tongue: string | null;
  other_languages: string[];
  smoking: Habit | null;
  drinking: Habit | null;
  relationship_goal: string | null;
  photos: UserPhoto[];
  video_url: string | null;
  role: string;
  status: UserStatus;
  is_profile_complete: boolean;
  last_active_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
