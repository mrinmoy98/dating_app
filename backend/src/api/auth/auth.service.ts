import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { Model } from 'mongoose';
import { Otp } from '../../entity/otp.entity';
import { User } from '../../entity/user.entity';
import { RegisterDto } from './dto/auth.dto';

/** Shape of a registration JWT as the flow progresses. */
interface RegPayload {
  phone?: string;
  email?: string | null;
  email_verified?: boolean;
  purpose?: string;
  role?: string;
}

@Injectable()
export class ApiAuthService {
  private readonly logger = new Logger('ApiAuthService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Otp') private readonly otpModel: Model<Otp>,
  ) {}

  // ===========================================================================
  // Phone OTP (step 1)
  // ===========================================================================
  async sendOtp(rawPhone: string) {
    const phone = this.normalizePhone(rawPhone);
    const code = await this.issueOtp(phone, 'phone');
    await this.sendSms(phone, code);
    return this.otpResponse(phone, code, `OTP sent to ${phone}`);
  }

  async verifyOtp(rawPhone: string, code: string) {
    const phone = this.normalizePhone(rawPhone);
    await this.checkOtp(phone, code);

    const user = await this.userModel.findOne({ phone });

    // Returning user with a finished profile → log them straight in.
    if (user && user.is_profile_complete) {
      user.phone_verified = true;
      user.last_active_at = new Date();
      await user.save();
      return {
        isNewUser: false,
        token: this.issueAuthToken(user),
        user: this.toPublicUser(user),
      };
    }

    // New / incomplete user → registration token (phone verified, email pending).
    return {
      isNewUser: true,
      registrationToken: this.issueRegistrationToken({
        phone,
        email: null,
        email_verified: false,
      }),
    };
  }

  // ===========================================================================
  // Email OTP (step 2) — requires a valid registration token
  // ===========================================================================
  async sendEmailOtp(token: RegPayload, rawEmail: string) {
    this.assertRegToken(token);
    const email = this.normalizeEmail(rawEmail);
    const code = await this.issueOtp(email, 'email');
    await this.sendEmail(email, code);
    return this.otpResponse(email, code, `Verification code sent to ${email}`);
  }

  async verifyEmailOtp(token: RegPayload, rawEmail: string, code: string) {
    this.assertRegToken(token);
    const email = this.normalizeEmail(rawEmail);
    await this.checkOtp(email, code);

    // Upgrade the registration token so it now carries the verified email.
    return {
      emailVerified: true,
      registrationToken: this.issueRegistrationToken({
        phone: token.phone,
        email,
        email_verified: true,
      }),
    };
  }

  // ===========================================================================
  // Complete registration (step 3) — phone & email come from the token
  // ===========================================================================
  async register(token: RegPayload, dto: RegisterDto) {
    this.assertRegToken(token);
    const phone = this.normalizePhone(token.phone as string);

    const update = {
      phone,
      phone_verified: true,
      email: token.email ?? null,
      email_verified: !!token.email_verified,
      first_name: dto.first_name?.trim(),
      dob: this.parseDate(dto.dob),
      gender: dto.gender ?? null,
      location: dto.location ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      height_cm: dto.height_cm ?? null,
      height_label: dto.height_label ?? null,
      relationship_status: dto.relationship_status ?? null,
      religion: dto.religion ?? null,
      mother_tongue: dto.mother_tongue ?? null,
      other_languages: dto.other_languages ?? [],
      smoking: dto.smoking ?? null,
      drinking: dto.drinking ?? null,
      relationship_goal: dto.relationship_goal ?? null,
      photos: (dto.photos ?? []).map((url, i) => ({
        url,
        position: i,
        is_primary: i === 0,
      })),
      video_url: dto.video_url ?? null,
      is_profile_complete: true,
      last_active_at: new Date(),
    };

    const user = await this.userModel.findOneAndUpdate(
      { phone },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return {
      token: this.issueAuthToken(user),
      user: this.toPublicUser(user),
    };
  }

  /** Current authenticated user (for the dynamic profile page). */
  async me(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.toPublicUser(user);
  }

  // ===========================================================================
  // OTP helpers (shared by phone + email)
  // ===========================================================================

  /** Create/replace an OTP for an identifier and return the plaintext code. */
  private async issueOtp(identifier: string, channel: 'phone' | 'email') {
    const code = String(randomInt(1000, 10000)); // 4-digit
    const codeHash = await bcrypt.hash(code, 10);
    const minutes = Number(this.config.get('OTP_EXPIRES_MINUTES')) || 5;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    await this.otpModel.findOneAndUpdate(
      { identifier },
      { identifier, channel, code_hash: codeHash, expires_at: expiresAt, attempts: 0, consumed: false },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return code;
  }

  /** Validate a submitted code for an identifier and consume it. Throws on failure. */
  private async checkOtp(identifier: string, code: string) {
    const otp = await this.otpModel.findOne({ identifier });
    if (!otp || otp.consumed) throw new BadRequestException('Request a new code');
    if (otp.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Code expired. Request a new one');
    }
    const maxAttempts = Number(this.config.get('OTP_MAX_ATTEMPTS')) || 5;
    if (otp.attempts >= maxAttempts) {
      throw new BadRequestException('Too many attempts. Request a new code');
    }
    const ok = await bcrypt.compare(code, otp.code_hash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      throw new BadRequestException('Incorrect code');
    }
    otp.consumed = true;
    await otp.save();
  }

  private otpResponse(target: string, code: string, message: string) {
    const minutes = Number(this.config.get('OTP_EXPIRES_MINUTES')) || 5;
    const devMode = this.config.get('OTP_DEV_MODE') !== 'false';
    return {
      target,
      message,
      expiresInMinutes: minutes,
      ...(devMode ? { devCode: code } : {}), // dev-only, so the app works without SMS/email
    };
  }

  /** Deliver an SMS OTP. Dev: just log. Wire a real gateway for production. */
  private async sendSms(phone: string, code: string) {
    this.logger.log(`SMS OTP for ${phone}: ${code}`);
  }

  /** Deliver an email OTP. Dev: just log. Wire SMTP (nodemailer) for production. */
  private async sendEmail(email: string, code: string) {
    this.logger.log(`EMAIL OTP for ${email}: ${code}`);
  }

  // ===========================================================================
  // Tokens
  // ===========================================================================
  private issueAuthToken(user: User) {
    return this.jwtService.sign({
      sub: String(user._id),
      phone: user.phone,
      role: 'user',
    });
  }

  private issueRegistrationToken(data: { phone?: string; email: string | null; email_verified: boolean }) {
    return this.jwtService.sign(
      {
        phone: data.phone,
        email: data.email,
        email_verified: data.email_verified,
        purpose: 'register',
        role: 'register',
      },
      { expiresIn: '30m' },
    );
  }

  private assertRegToken(token: RegPayload) {
    if (!token?.phone || token.purpose !== 'register') {
      throw new ForbiddenException('Invalid or missing registration token');
    }
  }

  private toPublicUser(user: User) {
    return {
      id: user._id,
      phone: user.phone,
      email: user.email,
      email_verified: user.email_verified,
      first_name: user.first_name,
      dob: user.dob,
      gender: user.gender,
      location: user.location,
      height_cm: user.height_cm,
      height_label: user.height_label,
      relationship_status: user.relationship_status,
      religion: user.religion,
      mother_tongue: user.mother_tongue,
      other_languages: user.other_languages,
      smoking: user.smoking,
      drinking: user.drinking,
      relationship_goal: user.relationship_goal,
      photos: user.photos,
      video_url: user.video_url,
      status: user.status,
      is_profile_complete: user.is_profile_complete,
    };
  }

  // ===========================================================================
  // Misc helpers
  // ===========================================================================
  private normalizePhone(phone: string) {
    const cleaned = (phone || '').replace(/[\s\-()]/g, '').trim();
    if (cleaned.length < 8) throw new BadRequestException('Enter a valid phone number');
    return cleaned;
  }

  private normalizeEmail(email: string) {
    const cleaned = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      throw new BadRequestException('Enter a valid email address');
    }
    return cleaned;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const dmY = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (dmY) {
      const [, d, m, y] = dmY;
      const parsed = new Date(Number(y), Number(m) - 1, Number(d));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    const iso = new Date(value);
    return isNaN(iso.getTime()) ? null : iso;
  }
}
