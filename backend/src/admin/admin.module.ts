import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from '../entity/admin.entity';
import { UserSchema } from '../entity/user.entity';
import { AdminAuthController } from './auth/auth.controller';
import { AdminAuthService } from './auth/auth.service';
import { AdminUsersController } from './users/users.controller';
import { AdminUsersService } from './users/users.service';

/**
 * Super-admin surface (dashboard): email/password auth + user management.
 * All routes live under /admin/* and require the admin/superadmin role
 * (except /admin/auth/login).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Admin', schema: AdminSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [AdminAuthController, AdminUsersController],
  providers: [AdminAuthService, AdminUsersService],
})
export class AdminModule {}
