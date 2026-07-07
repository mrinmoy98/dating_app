import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminAuthService } from './auth.service';
import { AdminLoginDto } from './dto/auth.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login (email + password)' })
  login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @Roles('admin', 'superadmin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the current logged-in admin' })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }
}
