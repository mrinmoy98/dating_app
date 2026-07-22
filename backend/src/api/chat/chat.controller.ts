import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RealtimeService } from '../../common/services/realtime.service';
import { Message, MessageType, pairKey, shapeMessage } from '../../entity/message.entity';
import { SocialService } from '../social/social.service';
import { ChatService } from './chat.service';

/** Voice notes and videos are the heavy ones; 40 MB covers both comfortably. */
const MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

@ApiTags('Chat')
@ApiBearerAuth('JWT')
@Controller('api/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class ChatController {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    private readonly social: SocialService,
    private readonly chat: ChatService,
    private readonly realtime: RealtimeService,
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
          online: this.realtime.isOnline(f.id),
          lastMessage: last
            ? {
                text: last.text,
                type: (last.type ?? 'text') as MessageType,
                from: String(last.from),
                delivered: !!last.delivered,
                read: !!last.read,
                created_at: last.created_at,
              }
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
    return rows.reverse().map(shapeMessage);
  }

  /** Live online/offline state for one friend — used when opening a thread. */
  @Get('presence/:userId')
  @ApiOperation({ summary: 'Is this user currently connected?' })
  presence(@Param('userId') other: string) {
    return { userId: other, online: this.realtime.isOnline(other) };
  }

  /**
   * Send a message with an attachment as `multipart/form-data`.
   *
   * Fields: `file` (the image / video / voice note / document), `to`, and an
   * optional `text` caption. The file is uploaded to Cloudinary, the message is
   * persisted, and both participants get a `chat_new` socket event — so this is
   * interchangeable with the `chat_send` socket event for plain text.
   */
  @Post('send')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send a chat message with an image/video/audio/file attachment' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ATTACHMENT_BYTES },
    }),
  )
  async send(
    @CurrentUser() user: { sub: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { to?: string; text?: string },
  ) {
    if (!body?.to) throw new BadRequestException('Recipient ("to") is required');
    if (!file) throw new BadRequestException('No file uploaded — use chat_send for plain text');

    const { type, attachment } = await this.chat.storeAttachment(user.sub, file);
    return this.chat.send(user.sub, { to: body.to, text: body.text, type, attachment });
  }

  /** Delete one of your own messages — it disappears for both participants. */
  @Delete('message/:id')
  @ApiOperation({ summary: 'Delete a message you sent' })
  async remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.chat.remove(user.sub, id);
  }

  /** Mark everything this friend sent me as read (REST twin of the `chat_read` event). */
  @Post('read/:userId')
  @ApiOperation({ summary: 'Mark a conversation as read' })
  async read(@CurrentUser() user: { sub: string }, @Param('userId') other: string) {
    return this.chat.markRead(user.sub, other);
  }
}
