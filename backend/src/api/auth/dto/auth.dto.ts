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

export class SendOtpDto {
  @IsString()
  @MinLength(8, { message: 'Enter a valid phone number' })
  @MaxLength(20)
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @IsString()
  @Length(4, 6)
  code: string;
}

export class SendEmailOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 6)
  code: string;
}

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
  dob?: string;

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
  @ArrayMaxSize(3, { message: 'You can select up to 3 languages' })
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
  photos?: string[];

  @IsOptional()
  @IsString()
  video_url?: string;
}


export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  first_name?: string;

  @IsOptional()
  @IsString()
  dob?: string;

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
  @ArrayMaxSize(3, { message: 'You can select up to 3 languages' })
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
  relationship_goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

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
  family_details?: any[];

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
  photos?: string[];

  @IsOptional()
  @IsString()
  video_url?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interested_in?: string[];

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

export class SetPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64)
  password: string;
}

export class LoginPasswordDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  identifier: string;

  @IsString()
  @MinLength(1)
  password: string;
}
