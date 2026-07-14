import { Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SocialService } from './social.service';

@ApiTags('Social')
@ApiBearerAuth('JWT')
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  // ---- follow lists (declare before :id routes so they aren't shadowed) ----
  @Get('follow/following')
  @ApiOperation({ summary: 'Users the current user follows' })
  following(@CurrentUser() user: { sub: string }) {
    return this.social.following(user.sub);
  }

  @Get('follow/followers')
  @ApiOperation({ summary: 'Users who follow the current user' })
  followers(@CurrentUser() user: { sub: string }) {
    return this.social.followers(user.sub);
  }

  @Post('follow/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Follow a user' })
  follow(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.follow(user.sub, id);
  }

  @Delete('follow/:id')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.unfollow(user.sub, id);
  }

  // ---- profile view (match/user profile) ----
  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user public profile (with follow + match status)' })
  getProfile(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.getProfile(user.sub, id);
  }
}
