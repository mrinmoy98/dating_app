/** Shared request/response types for the Dating App API. */

export type Gender = "Male" | "Female" | "Other";
export type Habit = "Regularly" | "Sometimes" | "Never";

export interface SendOtpResult {
  target: string;
  message: string;
  expiresInMinutes: number;
  devCode?: string;
}

export interface VerifyOtpResult {
  isNewUser: boolean;
  registrationToken?: string;
  token?: string;
  user?: any;
}

export interface VerifyEmailResult {
  emailVerified: boolean;
  registrationToken: string;
}

export interface AuthResult {
  token: string;
  user: any;
}

export interface RegisterPayload {
  first_name: string;
  dob?: string;
  gender?: Gender;
  location?: string;
  latitude?: number;
  longitude?: number;
  height_cm?: number;
  height_label?: string;
  weight_kg?: number;
  relationship_status?: string;
  religion?: string;
  mother_tongue?: string;
  other_languages?: string[];
  smoking?: Habit;
  drinking?: Habit;
  relationship_goal?: string;
  bio?: string;
  occupation?: string;
  education?: string;
  interests?: string[];
  diet?: string;
  last_name?: string;
  blood_group?: string;
  complexion?: string;
  health_info?: string;
  disability?: string;
  family_details?: any[];
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  photos?: string[];
  video_url?: string;
}

export interface Preferences {
  interested_in?: string[];
  age_min?: number;
  age_max?: number;
  max_distance_km?: number;
  preferred_religions?: string[];
  relationship_goal?: string;
  min_height_cm?: number;
  max_height_cm?: number;
  min_weight_kg?: number;
  max_weight_kg?: number;
  marital_status?: string[];
  income_currency?: string;
  income_min?: number;
  income_max?: number;
}

export interface MatchUser {
  matchId: string;
  id: string;
  firstName: string | null;
  lastName?: string | null;
  age: number | null;
  photoUrl: string | null;
  location: string | null;
  interests: string[];
  matchedOn: string;
  verified: boolean;
}

export interface SwipeResult {
  matched: boolean;
  match?: MatchUser;
}

// ---------------- CMS ----------------
export interface Language {
  _id: string;
  title: string;
  sequence: number;
  is_active: boolean;
}

export interface Banner {
  _id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: number;
  is_active: boolean;
}

export interface CmsPage {
  _id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  logo_url: string;
  support_email: string;
  support_phone: string;
  facebook: string;
  instagram: string;
  twitter: string;
  android_app_url: string;
  ios_app_url: string;
  min_age: number;
  maintenance_mode: boolean;
}

export interface ConnectionUser {
  id: string;
  firstName: string | null;
  lastName?: string | null;
  age: number | null;
  photoUrl: string | null;
  photos: string[];
  location: string | null;
  bio: string | null;
  occupation: string | null;
  education: string | null;
  interests: string[];
  gender: string | null;
  religion: string | null;
  height_label: string | null;
  relationship_goal: string | null;
  verified: boolean;
  // full profile details
  height_cm?: number | null;
  weight_kg?: number | null;
  relationship_status?: string | null;
  mother_tongue?: string | null;
  other_languages?: string[];
  smoking?: string | null;
  drinking?: string | null;
  diet?: string | null;
  blood_group?: string | null;
  complexion?: string | null;
  health_info?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  video_url?: string | null;
}

export interface UserProfile extends ConnectionUser {
  followers_count: number;
  following_count: number;
  is_following: boolean;
  follows_me: boolean;
  is_friend: boolean;
  is_matched: boolean;
  is_me: boolean;
  shared_interests?: string[];
}

// ---------------- Notifications ----------------
export type NotificationType =
  | "follow"
  | "follow_back"
  | "like"
  | "match"
  | "message"
  | "call";

export interface AppNotification {
  id: string;
  type: NotificationType;
  text: string;
  read: boolean;
  created_at: string;
  from: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  } | null;
}

// ---------------- Chat ----------------
export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  read?: boolean;
  created_at: string;
}

export interface ChatConversation {
  user: ConnectionUser;
  lastMessage: { text: string; from: string; created_at: string } | null;
  unread: number;
}

export interface DiscoverCard {
  id: string;
  firstName: string;
  age: number | null;
  photoUrl: string | null;
  photos: string[];
  location: string | null;
  distance: number | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  interests: string[];
  gender: string | null;
  religion: string | null;
  height_label: string | null;
  relationship_goal: string | null;
  verified: boolean;
}
