import * as mongoose from 'mongoose';

/**
 * Dating-app end user. Identity is phone-based (OTP login) — there is NO
 * password and NO email for regular users. Every onboarding field the mobile
 * app collects has its own typed field here (no JSON blobs).
 */

export type Gender = 'Male' | 'Female' | 'Other';
export type Habit = 'Regularly' | 'Sometimes' | 'Never';
export type UserStatus = 'active' | 'banned';

/**
 * Partner preferences — the criteria used to find candidates in Discover.
 * Empty arrays / null mean "no filter" for that dimension.
 */
const PreferenceSchema = new mongoose.Schema(
  {
    interested_in: { type: [String], default: [] }, // genders the user wants to see; [] = any
    age_min: { type: Number, default: 18 },
    age_max: { type: Number, default: 60 },
    max_distance_km: { type: Number, default: 100 },
    preferred_religions: { type: [String], default: [] }, // [] = any
    relationship_goal: { type: String, default: null }, // desired goal; null = any
    // physical range (canonical cm / kg)
    min_height_cm: { type: Number, default: null },
    max_height_cm: { type: Number, default: null },
    min_weight_kg: { type: Number, default: null },
    max_weight_kg: { type: Number, default: null },
    // partner marital status + income expectation
    marital_status: { type: [String], default: [] }, // [] = any
    income_currency: { type: String, default: null },
    income_min: { type: Number, default: null },
    income_max: { type: Number, default: null },
  },
  { _id: false },
);

/** One family member (matrimony-style family details). */
const FamilyDetailSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    relation: { type: String, default: '' }, // Father, Mother, Brother, …
    profession: { type: String, default: '' },
    currency: { type: String, default: null },
    income: { type: Number, default: null },
  },
  { _id: false },
);

/** Structured postal address with coordinates (drives distance search). */
const AddressSchema = new mongoose.Schema(
  {
    locality: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postal_code: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false },
);

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
    password: { type: String, default: null, select: false }, // bcrypt hash; optional password login

    // ---- basic profile (QuickIntro step) ----
    first_name: { type: String, default: null, trim: true },
    last_name: { type: String, default: null, trim: true },
    dob: { type: Date, default: null }, // birth date; age is computed from this
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },

    // ---- location (QuickIntro step) ----
    location: { type: String, default: null }, // free-text city/area the user typed
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // ---- physical (Height step) ----
    height_cm: { type: Number, default: null },
    height_label: { type: String, default: null }, // e.g. `5'0" (152 cm)`
    weight_kg: { type: Number, default: null }, // canonical weight in kg (UI may enter kg or lbs)

    // ---- lifestyle / preference steps ----
    relationship_status: { type: String, default: null }, // Single, Divorced, ...
    religion: { type: String, default: null },
    mother_tongue: { type: String, default: null },
    other_languages: { type: [String], default: [] },
    smoking: { type: String, enum: ['Regularly', 'Sometimes', 'Never'], default: null },
    drinking: { type: String, enum: ['Regularly', 'Sometimes', 'Never'], default: null },
    relationship_goal: { type: String, default: null },

    // ---- extended profile (dating details) ----
    bio: { type: String, default: null }, // free-text "About me"
    occupation: { type: String, default: null },
    education: { type: String, default: null },
    interests: { type: [String], default: [] }, // hobbies/tags shown on the card
    diet: { type: String, default: null }, // Vegetarian, Non-vegetarian, Vegan, Eggetarian

    // ---- matrimony details ----
    blood_group: { type: String, default: null }, // A+, O-, …
    complexion: { type: String, default: null }, // Fair, Wheatish, Dark, …
    health_info: { type: String, default: null }, // e.g. No health problem, Diabetes, …
    disability: { type: String, default: null },
    family_details: { type: [FamilyDetailSchema], default: [] },

    // ---- structured address (drives distance search) ----
    address: { type: AddressSchema, default: () => ({}) },

    // ---- media ----
    photos: { type: [PhotoSchema], default: [] },
    video_url: { type: String, default: null }, // optional intro video

    // ---- partner preferences (drives Discover) ----
    preferences: { type: PreferenceSchema, default: () => ({}) },

    // ---- account state ----
    role: { type: String, default: 'user' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    is_profile_complete: { type: Boolean, default: false },
    last_active_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

/**
 * One account per email. A partial unique index enforces uniqueness only over
 * real string emails, so the many users that still have `email: null` (before
 * they verify) don't collide with each other. Combined with the `unique` phone
 * above, this guarantees: one phone number AND one email = exactly one account.
 */
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export interface UserPhoto {
  url: string;
  position: number;
  is_primary: boolean;
}

export interface UserPreferences {
  interested_in: string[];
  age_min: number;
  age_max: number;
  max_distance_km: number;
  preferred_religions: string[];
  relationship_goal: string | null;
  min_height_cm: number | null;
  max_height_cm: number | null;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  marital_status: string[];
  income_currency: string | null;
  income_min: number | null;
  income_max: number | null;
}

export interface UserFamilyDetail {
  name: string;
  relation: string;
  profession: string;
  currency: string | null;
  income: number | null;
}

export interface UserAddress {
  locality: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
}

export interface User extends mongoose.Document {
  phone: string;
  phone_verified: boolean;
  email: string | null;
  email_verified: boolean;
  password?: string | null;
  first_name: string | null;
  last_name: string | null;
  dob: Date | null;
  gender: Gender | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  height_cm: number | null;
  height_label: string | null;
  weight_kg: number | null;
  relationship_status: string | null;
  religion: string | null;
  mother_tongue: string | null;
  other_languages: string[];
  smoking: Habit | null;
  drinking: Habit | null;
  relationship_goal: string | null;
  bio: string | null;
  occupation: string | null;
  education: string | null;
  interests: string[];
  diet: string | null;
  blood_group: string | null;
  complexion: string | null;
  health_info: string | null;
  disability: string | null;
  family_details: UserFamilyDetail[];
  address: UserAddress;
  photos: UserPhoto[];
  video_url: string | null;
  preferences: UserPreferences;
  role: string;
  status: UserStatus;
  is_profile_complete: boolean;
  last_active_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
