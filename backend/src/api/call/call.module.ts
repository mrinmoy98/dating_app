import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../entity/user.entity';
import { CallGateway } from './call.gateway';

/** Random 1:1 video-call matchmaking + WebRTC signaling (socket.io, ns /call). */
@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [CallGateway],
})
export class CallModule {}
