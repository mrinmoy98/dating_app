import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpSchema } from '../entity/otp.entity';
import { UserSchema } from '../entity/user.entity';
import { ApiAuthController } from './auth/auth.controller';
import { ApiAuthService } from './auth/auth.service';
import { UploadController } from './upload/upload.controller';

/**
 * Public mobile-app surface. All routes live under /api/*:
 *  - /api/auth/send-otp, verify-otp, register, me   (phone/OTP onboarding)
 *  - /api/upload/photos                             (profile photo upload)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Otp', schema: OtpSchema },
    ]),
  ],
  controllers: [ApiAuthController, UploadController],
  providers: [ApiAuthService],
})
export class ApiModule {}
