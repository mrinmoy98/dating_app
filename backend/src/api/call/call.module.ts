import { Module } from '@nestjs/common';
import { ApiModule } from '../api.module';
import { CallGateway } from './call.gateway';

/**
 * Realtime layer (Socket.IO, namespace /rt): 1:1 chat, presence, and
 * frame-based video calls between friends. Reuses ApiModule's SocialService
 * (friendship checks) and the User/Message models.
 */
@Module({
  imports: [ApiModule],
  providers: [CallGateway],
})
export class CallModule {}
