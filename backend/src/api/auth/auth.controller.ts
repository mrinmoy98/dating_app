import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiAuthService } from './auth.service';
import {
  RegisterDto,
  SendEmailOtpDto,
  SendOtpDto,
  VerifyEmailOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('User Auth')
@Controller('api/auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiAuthController {
  constructor(private readonly authService: ApiAuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a login/registration OTP to a phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify OTP — returns an auth token (existing user) or a registration token (new user)',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Post('send-email-otp')
  @Roles('register')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Send an email verification code (registration token required)' })
  sendEmailOtp(@CurrentUser() user: any, @Body() dto: SendEmailOtpDto) {
    return this.authService.sendEmailOtp(user, dto.email);
  }

  @Post('verify-email-otp')
  @Roles('register')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify the email code → upgraded registration token' })
  verifyEmailOtp(@CurrentUser() user: any, @Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(user, dto.email, dto.code);
  }

  @Post('register')
  @Roles('register')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Complete registration (send the registration token as Bearer)' })
  register(
    @CurrentUser() user: { phone: string; purpose: string },
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(user, dto);
  }

  @Get('me')
  @Roles('user')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the current logged-in user' })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }
}
