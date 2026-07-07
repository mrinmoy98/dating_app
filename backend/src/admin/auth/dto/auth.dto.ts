import { IsEmail, IsString, MinLength } from 'class-validator';

/** Admin dashboard login (email + password). */
export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
