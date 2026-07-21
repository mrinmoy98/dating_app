import {
  BadRequestException,
  ConflictException,
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
import { Swipe } from '../../entity/swipe.entity';
import { User } from '../../entity/user.entity';
import {
  LoginPasswordDto,
  RegisterDto,
  SetPasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/auth.dto';

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
    @InjectModel('Swipe') private readonly swipeModel: Model<Swipe>,
  ) {}

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

    if (user && user.status === 'banned') {
      throw new ForbiddenException('This account has been suspended');
    }

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

    return {
      isNewUser: true,
      registrationToken: this.issueRegistrationToken({
        phone,
        email: null,
        email_verified: false,
      }),
    };
  }

  
  async sendEmailOtp(token: RegPayload, rawEmail: string) {
    this.assertRegToken(token);
    const email = this.normalizeEmail(rawEmail);
    await this.assertEmailAvailable(email, token.phone);
    const code = await this.issueOtp(email, 'email');
    await this.sendEmail(email, code);
    return this.otpResponse(email, code, `Verification code sent to ${email}`);
  }

  async verifyEmailOtp(token: RegPayload, rawEmail: string, code: string) {
    this.assertRegToken(token);
    const email = this.normalizeEmail(rawEmail);
    await this.assertEmailAvailable(email, token.phone);
    await this.checkOtp(email, code);

    return {
      emailVerified: true,
      registrationToken: this.issueRegistrationToken({
        phone: token.phone,
        email,
        email_verified: true,
      }),
    };
  }

  
  async register(token: RegPayload, dto: RegisterDto) {
    this.assertRegToken(token);
    const phone = this.normalizePhone(token.phone as string);

    if (token.email) {
      await this.assertEmailAvailable(this.normalizeEmail(token.email), phone);
    }

    const update = {
      phone,
      phone_verified: true,
      email: token.email ?? null,
      email_verified: !!token.email_verified,
      first_name: dto.first_name?.trim(),
      last_name: dto.last_name?.trim() ?? null,
      dob: this.parseDate(dto.dob),
      gender: dto.gender ?? null,
      location: dto.location ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      address: {
        locality: dto.location ?? '',
        city: dto.city ?? '',
        state: dto.state ?? '',
        country: dto.country ?? '',
        postal_code: dto.postal_code ?? '',
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
      height_cm: dto.height_cm ?? null,
      height_label: dto.height_label ?? null,
      weight_kg: dto.weight_kg ?? null,
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

    let user: User;
    try {
      user = await this.userModel.findOneAndUpdate(
        { phone },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        const field = err?.keyPattern?.email ? 'email address' : 'phone number';
        throw new ConflictException(`This ${field} is already registered`);
      }
      throw err;
    }

    return {
      token: this.issueAuthToken(user),
      user: this.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new UnauthorizedException('User not found');
    return this.toPublicUser(user);
  }


  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status === 'banned') {
      throw new ForbiddenException('This account has been suspended');
    }

    const set: Record<string, unknown> = {};
    const assign = <K extends keyof UpdateProfileDto>(key: K) => {
      if (dto[key] !== undefined) set[key as string] = dto[key];
    };

    assign('gender');
    assign('location');
    assign('latitude');
    assign('longitude');
    assign('height_cm');
    assign('height_label');
    assign('weight_kg');
    assign('relationship_status');
    assign('religion');
    assign('mother_tongue');
    assign('other_languages');
    assign('smoking');
    assign('drinking');
    assign('relationship_goal');
    assign('bio');
    assign('occupation');
    assign('education');
    assign('interests');
    assign('diet');
    assign('last_name');
    assign('blood_group');
    assign('complexion');
    assign('health_info');
    assign('disability');
    assign('family_details');
    assign('video_url');
    assign('cover_url');

    if (dto.city !== undefined) set['address.city'] = dto.city;
    if (dto.state !== undefined) set['address.state'] = dto.state;
    if (dto.country !== undefined) set['address.country'] = dto.country;
    if (dto.postal_code !== undefined) set['address.postal_code'] = dto.postal_code;
    if (dto.latitude !== undefined) set['address.latitude'] = dto.latitude;
    if (dto.longitude !== undefined) set['address.longitude'] = dto.longitude;

    if (dto.first_name !== undefined) set.first_name = dto.first_name.trim();
    if (dto.dob !== undefined) set.dob = this.parseDate(dto.dob);
    if (dto.photos !== undefined) {
      set.photos = dto.photos.map((url, i) => ({
        url,
        position: i,
        is_primary: i === 0,
      }));
    }

    set.last_active_at = new Date();

    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: set },
      { new: true, runValidators: true },
    );
    return this.toPublicUser(updated as User);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const ageMin = dto.age_min ?? user.preferences?.age_min ?? 18;
    const ageMax = dto.age_max ?? user.preferences?.age_max ?? 60;
    if (ageMin > ageMax) {
      throw new BadRequestException('Minimum age cannot be greater than maximum age');
    }

    const set: Record<string, unknown> = {};
    (
      [
        'interested_in',
        'age_min',
        'age_max',
        'max_distance_km',
        'preferred_religions',
        'relationship_goal',
        'min_height_cm',
        'max_height_cm',
        'min_weight_kg',
        'max_weight_kg',
        'marital_status',
        'income_currency',
        'income_min',
        'income_max',
      ] as const
    ).forEach((k) => {
      if (dto[k] !== undefined) set[`preferences.${k}`] = dto[k];
    });

    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: set },
      { new: true, runValidators: true },
    );
    return this.toPublicUser(updated as User);
  }


  async discover(userId: string) {
    const me = await this.userModel.findById(userId);
    if (!me) throw new UnauthorizedException('User not found');

    const p = me.preferences ?? ({} as any);
    const ageMin = p.age_min ?? 18;
    const ageMax = p.age_max ?? 60;
    const now = new Date();
    const maxDob = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
    const minDob = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());

    const swiped = await this.swipeModel.find({ from: me._id }).select('to').lean();
    const excludeIds = [me._id, ...swiped.map((s) => s.to)];

    const query: any = {
      _id: { $nin: excludeIds },
      status: 'active',
      is_profile_complete: true,
      dob: { $gte: minDob, $lte: maxDob },
    };
    let interestedIn: string[] = p.interested_in ?? [];
    if (!interestedIn.length) {
      if (me.gender === 'Male') interestedIn = ['Female'];
      else if (me.gender === 'Female') interestedIn = ['Male'];
    }
    if (interestedIn.length) query.gender = { $in: interestedIn };
    if (p.preferred_religions?.length) query.religion = { $in: p.preferred_religions };
    if (p.relationship_goal) query.relationship_goal = p.relationship_goal;
    if (p.marital_status?.length) query.relationship_status = { $in: p.marital_status };

    if (p.min_height_cm != null || p.max_height_cm != null) {
      query.height_cm = {};
      if (p.min_height_cm != null) query.height_cm.$gte = p.min_height_cm;
      if (p.max_height_cm != null) query.height_cm.$lte = p.max_height_cm;
    }
    if (p.min_weight_kg != null || p.max_weight_kg != null) {
      query.weight_kg = {};
      if (p.min_weight_kg != null) query.weight_kg.$gte = p.min_weight_kg;
      if (p.max_weight_kg != null) query.weight_kg.$lte = p.max_weight_kg;
    }

    const candidates = await this.userModel
      .find(query)
      .sort({ last_active_at: -1 })
      .limit(100);

    const hasGeo = me.latitude != null && me.longitude != null;
    const maxDist = p.max_distance_km ?? null;

    return candidates
      .map((c) => {
        const d =
          hasGeo && c.latitude != null && c.longitude != null
            ? this.distanceKm(me.latitude as number, me.longitude as number, c.latitude, c.longitude)
            : null;
        return { c, d };
      })
      .filter(({ d }) => !(hasGeo && maxDist != null && d != null && d > maxDist))
      .sort((a, b) => (a.d ?? Number.MAX_SAFE_INTEGER) - (b.d ?? Number.MAX_SAFE_INTEGER))
      .map(({ c, d }) => this.toCard(c, d));
  }


  async setPassword(userId: string, dto: SetPasswordDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { password: hash } },
      { new: true },
    );
    if (!user) throw new UnauthorizedException('User not found');
    return { success: true, message: 'Password saved. You can now log in with it.' };
  }

  async loginWithPassword(dto: LoginPasswordDto) {
    const id = (dto.identifier || '').trim();
    const query = id.includes('@')
      ? { email: id.toLowerCase() }
      : { phone: this.normalizePhone(id) };

    const user = await this.userModel.findOne(query).select('+password');
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }
    if (user.status === 'banned') {
      throw new ForbiddenException('This account has been suspended');
    }
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid email/phone or password');

    user.last_active_at = new Date();
    await user.save();
    return { token: this.issueAuthToken(user), user: this.toPublicUser(user) };
  }


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
      ...(devMode ? { devCode: code } : {}),
    };
  }

  private async sendSms(phone: string, code: string) {
    this.logger.log(`SMS OTP for ${phone}: ${code}`);
  }

  private async sendEmail(email: string, code: string) {
    this.logger.log(`EMAIL OTP for ${email}: ${code}`);
  }

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

  
  private async assertEmailAvailable(email: string, phone?: string) {
    const existing = await this.userModel.findOne({ email }).lean();
    if (!existing) return;
    const ownerPhone = existing.phone;
    const claimantPhone = phone ? this.normalizePhone(phone) : null;
    if (ownerPhone !== claimantPhone) {
      throw new ConflictException(
        'This email is already registered with another account',
      );
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
      weight_kg: user.weight_kg,
      relationship_status: user.relationship_status,
      religion: user.religion,
      mother_tongue: user.mother_tongue,
      other_languages: user.other_languages,
      smoking: user.smoking,
      drinking: user.drinking,
      relationship_goal: user.relationship_goal,
      bio: user.bio,
      occupation: user.occupation,
      education: user.education,
      interests: user.interests,
      diet: user.diet,
      last_name: user.last_name,
      blood_group: user.blood_group,
      complexion: user.complexion,
      health_info: user.health_info,
      disability: user.disability,
      family_details: user.family_details,
      address: user.address,
      has_password: !!user.password,
      photos: user.photos,
      cover_url: user.cover_url,
      video_url: user.video_url,
      preferences: user.preferences,
      status: user.status,
      is_profile_complete: user.is_profile_complete,
    };
  }

  private toCard(user: User, distanceKm: number | null) {
    const primary = user.photos?.find((ph) => ph.is_primary) ?? user.photos?.[0];
    return {
      id: String(user._id),
      firstName: user.first_name,
      lastName: user.last_name,
      age: this.calcAge(user.dob),
      photoUrl: primary?.url ?? null,
      photos: (user.photos ?? []).map((ph) => ph.url),
      location: user.location,
      distance: distanceKm != null ? Math.round(distanceKm) : null, // in km
      occupation: user.occupation,
      education: user.education,
      bio: user.bio,
      interests: user.interests ?? [],
      gender: user.gender,
      religion: user.religion,
      height_label: user.height_label,
      relationship_goal: user.relationship_goal,
      verified: !!(user.phone_verified && user.email_verified),
    };
  }

  private calcAge(dob: Date | null): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

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
