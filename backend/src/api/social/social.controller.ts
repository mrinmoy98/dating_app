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

  @Get('follow/friends')
  @ApiOperation({ summary: 'Mutual follows — people you can chat / call' })
  friends(@CurrentUser() user: { sub: string }) {
    return this.social.friends(user.sub);
  }

  // ---- discovery lists ----
  @Get('users/new')
  @ApiOperation({ summary: 'Newest members you are not following yet' })
  newUsers(@CurrentUser() user: { sub: string }) {
    return this.social.newUsers(user.sub);
  }

  @Get('users/by-interest')
  @ApiOperation({ summary: 'People who share your interests' })
  byInterest(@CurrentUser() user: { sub: string }) {
    return this.social.byInterest(user.sub);
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

  @Delete('followers/:id')
  @ApiOperation({ summary: 'Remove someone from my followers' })
  removeFollower(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.removeFollower(user.sub, id);
  }

  // ---- another user's follow lists (opened from their profile) ----
  @Get('users/:id/followers')
  @ApiOperation({ summary: 'Users who follow a given user' })
  followersOf(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.followers(id, user.sub);
  }

  @Get('users/:id/following')
  @ApiOperation({ summary: 'Users a given user follows' })
  followingOf(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.following(id, user.sub);
  }

  // ---- profile view (match/user profile) ----
  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user public profile (with follow + match status)' })
  getProfile(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.social.getProfile(user.sub, id);
  }
}
