import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowSchema } from '../entity/follow.entity';
import { MatchSchema } from '../entity/match.entity';
import { MessageSchema } from '../entity/message.entity';
import { NotificationSchema } from '../entity/notification.entity';
import { OtpSchema } from '../entity/otp.entity';
import { SwipeSchema } from '../entity/swipe.entity';
import { UserSchema } from '../entity/user.entity';
import { ApiAuthController } from './auth/auth.controller';
import { ApiAuthService } from './auth/auth.service';
import { ChatController } from './chat/chat.controller';
import { MatchController } from './match/match.controller';
import { MatchService } from './match/match.service';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { SocialController } from './social/social.controller';
import { SocialService } from './social/social.service';
import { UploadController } from './upload/upload.controller';

/**
 * Public mobile-app surface. All routes live under /api/*:
 *  - /api/auth/*                     phone/OTP onboarding, profile, preferences, discovery
 *  - /api/match/*                    like/pass + matches
 *  - /api/follow/*, /api/users/*     follow/unfollow, friends, new users, interests
 *  - /api/chat/*                     conversation list + message history
 *  - /api/upload/*                   profile photo & video upload
 * Realtime (chat + calls) runs over Socket.IO — see CallModule.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Otp', schema: OtpSchema },
      { name: 'Swipe', schema: SwipeSchema },
      { name: 'Match', schema: MatchSchema },
      { name: 'Follow', schema: FollowSchema },
      { name: 'Message', schema: MessageSchema },
      { name: 'Notification', schema: NotificationSchema },
    ]),
  ],
  controllers: [
    ApiAuthController,
    UploadController,
    MatchController,
    SocialController,
    ChatController,
    NotificationController,
  ],
  providers: [ApiAuthService, MatchService, SocialService, NotificationService],
  // CallModule (socket gateway) needs friendship checks + live notifications.
  exports: [SocialService, NotificationService, MongooseModule],
})
export class ApiModule {}
