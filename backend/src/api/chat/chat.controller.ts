import { Controller, ForbiddenException, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Message, pairKey } from '../../entity/message.entity';
import { SocialService } from '../social/social.service';

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('api/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class ChatController {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    private readonly social: SocialService,
  ) {}

  /** Conversation list — one row per friend, with the last message + unread count. */
  @Get('conversations')
  @ApiOperation({ summary: 'Chat list (friends with last message)' })
  async conversations(@CurrentUser() user: { sub: string }) {
    const friends = (await this.social.friends(user.sub)) as any[];
    return Promise.all(
      friends.map(async (f) => {
        const key = pairKey(user.sub, f.id);
        const [last, unread] = await Promise.all([
          this.messageModel.findOne({ pair_key: key }).sort({ created_at: -1 }).lean(),
          this.messageModel.countDocuments({ pair_key: key, to: user.sub, read: false }),
        ]);
        return {
          user: f,
          lastMessage: last
            ? { text: last.text, from: String(last.from), created_at: last.created_at }
            : null,
          unread,
        };
      }),
    ).then((rows) =>
      // Most recent conversation first; friends with no messages at the end.
      rows.sort((a, b) => {
        const ta = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const tb = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return tb - ta;
      }),
    );
  }

  /** Message history with one friend (newest last). */
  @Get('with/:userId')
  @ApiOperation({ summary: 'Messages exchanged with a friend' })
  async history(
    @CurrentUser() user: { sub: string },
    @Param('userId') other: string,
    @Query('limit') limit?: string,
  ) {
    if (!(await this.social.areFriends(user.sub, other))) {
      throw new ForbiddenException('You can only chat with people who follow you back');
    }
    const take = Math.min(Number(limit) || 50, 200);
    const rows = await this.messageModel
      .find({ pair_key: pairKey(user.sub, other) })
      .sort({ created_at: -1 })
      .limit(take)
      .lean();
    return rows
      .reverse()
      .map((m) => ({
        id: String(m._id),
        from: String(m.from),
        to: String(m.to),
        text: m.text,
        read: m.read,
        created_at: m.created_at,
      }));
  }
}
