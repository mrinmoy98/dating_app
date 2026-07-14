import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowSchema } from '../entity/follow.entity';
import { MatchSchema } from '../entity/match.entity';
import { OtpSchema } from '../entity/otp.entity';
import { SwipeSchema } from '../entity/swipe.entity';
import { UserSchema } from '../entity/user.entity';
import { ApiAuthController } from './auth/auth.controller';
import { ApiAuthService } from './auth/auth.service';
import { MatchController } from './match/match.controller';
import { MatchService } from './match/match.service';
import { SocialController } from './social/social.controller';
import { SocialService } from './social/social.service';
import { UploadController } from './upload/upload.controller';

/**
 * Public mobile-app surface. All routes live under /api/*:
 *  - /api/auth/*      phone/OTP onboarding, profile, preferences, discovery
 *  - /api/match/*     like/pass + matches
 *  - /api/follow/*, /api/users/:id   follow/unfollow + profile view
 *  - /api/upload/*    profile photo & video upload
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Otp', schema: OtpSchema },
      { name: 'Swipe', schema: SwipeSchema },
      { name: 'Match', schema: MatchSchema },
      { name: 'Follow', schema: FollowSchema },
    ]),
  ],
  controllers: [ApiAuthController, UploadController, MatchController, SocialController],
  providers: [ApiAuthService, MatchService, SocialService],
})
export class ApiModule {}
