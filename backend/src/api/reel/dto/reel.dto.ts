import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReelDto {
  @ApiProperty({
    example:
      'https://res.cloudinary.com/<cloud>/video/upload/v1/sn/mrinmoy123/reels/1784207246060_sangamX.mp4',
  })
  @IsString()
  video_url: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/<cloud>/image/upload/v1/sn/mrinmoy123/reels/1784207246060_sangamX.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiPropertyOptional({ example: 'Golden hour walks 🌇' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;

  @ApiPropertyOptional({ example: 'original audio' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  music?: string;
}
