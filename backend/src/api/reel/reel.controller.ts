import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateReelDto } from './dto/reel.dto';
import { ReelService } from './reel.service';

@ApiTags('Reels')
@ApiBearerAuth('JWT')
@Controller('api/reels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class ReelController {
  constructor(private readonly reels: ReelService) {}

  @Post()
  @ApiOperation({ summary: 'Post a reel (upload the video first via /api/upload/video)' })
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateReelDto) {
    return this.reels.create(user.sub, dto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Reels feed — people you follow first' })
  feed(@CurrentUser() user: { sub: string }) {
    return this.reels.feed(user.sub);
  }

  @Get('mine')
  @ApiOperation({ summary: 'My own reels' })
  mine(@CurrentUser() user: { sub: string }) {
    return this.reels.byUser(user.sub, user.sub);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Reels posted by one user (profile grid)' })
  byUser(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.reels.byUser(user.sub, id);
  }

  @Post(':id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like / unlike a reel' })
  like(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.reels.toggleLike(user.sub, id);
  }

  @Post(':id/view')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark this reel as watched (counts once per user)' })
  view(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.reels.view(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my reels' })
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.reels.remove(user.sub, id);
  }
}
