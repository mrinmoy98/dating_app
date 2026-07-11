import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SwipeDto } from './dto/match.dto';
import { MatchService } from './match.service';

@ApiTags('Match')
@ApiBearerAuth('JWT')
@Controller('api/match')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('swipe')
  @Roles('user')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like or pass a user; returns { matched } (true when it becomes a match)' })
  swipe(@CurrentUser() user: { sub: string }, @Body() dto: SwipeDto) {
    return this.matchService.swipe(user.sub, dto.targetId, dto.action);
  }

  @Get('matches')
  @Roles('user')
  @ApiOperation({ summary: 'List the current user’s matches' })
  matches(@CurrentUser() user: { sub: string }) {
    return this.matchService.getMatches(user.sub);
  }
}
