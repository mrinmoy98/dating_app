import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
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
