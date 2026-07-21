import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReelDto {
  @ApiProperty({ example: 'http://localhost:4000/uploads/1720000000-abc.mp4' })
  @IsString()
  video_url: string;

  @ApiPropertyOptional({ example: 'http://localhost:4000/uploads/1720000000-abc.jpg' })
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
