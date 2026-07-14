import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// ---------------- Banners ----------------
export class CreateBannerDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsString() @MinLength(1) image_url: string;
  @IsOptional() @IsString() link_url?: string;
  @IsOptional() @IsNumber() position?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateBannerDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() image_url?: string;
  @IsOptional() @IsString() link_url?: string;
  @IsOptional() @IsNumber() position?: number;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

// ---------------- Pages ----------------
export class CreatePageDto {
  @IsString() @MinLength(1) @MaxLength(80) slug: string;
  @IsString() @MinLength(1) @MaxLength(160) title: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsBoolean() is_published?: boolean;
}

export class UpdatePageDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsBoolean() is_published?: boolean;
}

// ---------------- Settings ----------------
export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(120) site_name?: string;
  @IsOptional() @IsString() @MaxLength(200) tagline?: string;
  @IsOptional() @IsString() logo_url?: string;
  @IsOptional() @IsString() @MaxLength(160) support_email?: string;
  @IsOptional() @IsString() @MaxLength(40) support_phone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() android_app_url?: string;
  @IsOptional() @IsString() ios_app_url?: string;
  @IsOptional() @IsNumber() min_age?: number;
  @IsOptional() @IsBoolean() maintenance_mode?: boolean;
}
