import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListUsersDto, UpdateUserStatusDto } from './dto/users.dto';
import { AdminUsersService } from './users.service';

@ApiTags('Admin Users')
@ApiBearerAuth('JWT')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform user statistics (dashboard cards)' })
  stats() {
    return this.usersService.stats();
  }

  @Get()
  @ApiOperation({ summary: 'List users (paginated, searchable, filterable)' })
  list(@Query() query: ListUsersDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by id' })
  getOne(@Param('id') id: string) {
    return this.usersService.getOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or ban a user' })
  setStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.setStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user account' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
