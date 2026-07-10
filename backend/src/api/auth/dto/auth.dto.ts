import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Step 1 — request an OTP for a phone number. */
export class SendOtpDto {
  @IsString()
  @MinLength(8, { message: 'Enter a valid phone number' })
  @MaxLength(20)
  phone: string;
}

/** Step 1b — verify the phone OTP code. */
export class VerifyOtpDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @IsString()
  @Length(4, 6)
  code: string;
}

/** Step 2 — request an OTP for an email (needs the registration token). */
export class SendEmailOtpDto {
  @IsEmail()
  email: string;
}

/** Step 2b — verify the email OTP code. */
export class VerifyEmailOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 6)
  code: string;
}

/**
 * Step 3 — complete registration. Phone comes from the verified registration
 * token (Authorization header), so it is NOT in the body. Only first_name is
 * strictly required; the rest of onboarding is best-effort so a user is never
 * blocked from finishing.
 */
export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  first_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @IsOptional()
  @IsString()
  dob?: string; // ISO date or DD/MM/YYYY

  @IsOptional()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  height_cm?: number;

  @IsOptional()
  @IsString()
  height_label?: string;

  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @IsOptional()
  @IsString()
  relationship_status?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  mother_tongue?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  other_languages?: string[];

  @IsOptional()
  @IsIn(['Regularly', 'Sometimes', 'Never'])
  smoking?: 'Regularly' | 'Sometimes' | 'Never';

  @IsOptional()
  @IsIn(['Regularly', 'Sometimes', 'Never'])
  drinking?: 'Regularly' | 'Sometimes' | 'Never';

  @IsOptional()
  @IsString()
  relationship_goal?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos?: string[]; // uploaded photo URLs from /api/upload/photos

  @IsOptional()
  @IsString()
  video_url?: string; // uploaded intro video URL from /api/upload/video
}

/**
 * Update an existing profile. Every field is optional — only the keys present
 * in the body are changed (PATCH semantics). Identity fields (phone, email) are
 * intentionally NOT here: they are fixed at registration so the "one phone +
 * one email = one account" guarantee always holds.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  first_name?: string;

  @IsOptional()
  @IsString()
  dob?: string; // ISO date or DD/MM/YYYY

  @IsOptional()
  @IsIn(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  height_cm?: number;

  @IsOptional()
  @IsString()
  height_label?: string;

  @IsOptional()
  @IsNumber()
  weight_kg?: number;

  @IsOptional()
  @IsString()
  relationship_status?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  mother_tongue?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  other_languages?: string[];

  @IsOptional()
  @IsIn(['Regularly', 'Sometimes', 'Never'])
  smoking?: 'Regularly' | 'Sometimes' | 'Never';

  @IsOptional()
  @IsIn(['Regularly', 'Sometimes', 'Never'])
  drinking?: 'Regularly' | 'Sometimes' | 'Never';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationship_goal?: string; // desired relationship goal (Long-term, Casual, …)

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string; // free-text "About me"

  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  education?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  diet?: string;

  // ---- matrimony details ----
  @IsOptional()
  @IsString()
  @MaxLength(80)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  blood_group?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  complexion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  health_info?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  disability?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  family_details?: any[]; // [{ name, relation, profession, income, currency }]

  // ---- structured address ----
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  photos?: string[]; // full replacement set of photo URLs

  @IsOptional()
  @IsString()
  video_url?: string;
}

/**
 * Update partner-search preferences. Every field is optional (PATCH). Empty
 * arrays / null clear a filter ("show anyone" for that dimension).
 */
export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interested_in?: string[]; // ['Male'] | ['Female'] | ['Male','Female','Other'] | []

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age_max?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  max_distance_km?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_religions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationship_goal?: string;

  @IsOptional()
  @IsNumber()
  min_height_cm?: number;

  @IsOptional()
  @IsNumber()
  max_height_cm?: number;

  @IsOptional()
  @IsNumber()
  min_weight_kg?: number;

  @IsOptional()
  @IsNumber()
  max_weight_kg?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marital_status?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  income_currency?: string;

  @IsOptional()
  @IsNumber()
  income_min?: number;

  @IsOptional()
  @IsNumber()
  income_max?: number;
}

/** Set (or change) the account password — requires a logged-in auth token. */
export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64)
  password: string;
}

/** Log in with email OR phone + password (alternative to OTP). */
export class LoginPasswordDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier: string; // email or phone

  @IsString()
  @MinLength(1)
  password: string;
}
