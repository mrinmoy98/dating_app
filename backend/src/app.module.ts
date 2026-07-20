import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';
import { ApiModule } from './api/api.module';
import { CallModule } from './api/call/call.module';
import { CmsModule } from './cms/cms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 100 }] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URL');
        if (!uri) throw new Error('MONGODB_URL is not set. Define it in backend/.env');
        return { uri };
      },
    }),
    // Global JWT so guards/services in every module can sign & verify tokens
    // with the same secret.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET is not set. Define it in backend/.env');
        return {
          secret,
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '24h' },
        };
      },
    }),
    AdminModule,
    ApiModule,
    CmsModule,
    CallModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
})
export class AppModule {}
