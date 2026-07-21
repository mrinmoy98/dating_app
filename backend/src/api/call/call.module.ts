import { Module } from '@nestjs/common';
import { ApiModule } from '../api.module';
import { CallGateway } from './call.gateway';

@Module({
  imports: [ApiModule],
  providers: [CallGateway],
})
export class CallModule {}
