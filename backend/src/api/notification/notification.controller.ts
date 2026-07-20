import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (newest first)' })
  list(@CurrentUser() user: { sub: string }) {
    return this.notifications.list(user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications' })
  async unread(@CurrentUser() user: { sub: string }) {
    return { count: await this.notifications.unreadCount(user.sub) };
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentUser() user: { sub: string }) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  read(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.notifications.markRead(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.notifications.remove(user.sub, id);
  }
}
