import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiAuthService } from './auth.service';
import {
  LoginPasswordDto,
  RegisterDto,
  SendEmailOtpDto,
  SendOtpDto,
  SetPasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
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

  @Public()
  @Post('login-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with email/phone + password' })
  loginPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @Post('set-password')
  @Roles('user')
  @HttpCode(200)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Set or change the account password' })
  setPassword(@CurrentUser() user: { sub: string }, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(user.sub, dto);
  }

  @Get('me')
  @Roles('user')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get the current logged-in user' })
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }

  @Patch('me')
  @Roles('user')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update the current user profile (only sent fields change)' })
  updateProfile(@CurrentUser() user: { sub: string }, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @Patch('preferences')
  @Roles('user')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update partner-search preferences' })
  updatePreferences(@CurrentUser() user: { sub: string }, @Body() dto: UpdatePreferencesDto) {
    return this.authService.updatePreferences(user.sub, dto);
  }

  @Get('discover')
  @Roles('user')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get candidate partners matching your preferences' })
  discover(@CurrentUser() user: { sub: string }) {
    return this.authService.discover(user.sub);
  }
}
