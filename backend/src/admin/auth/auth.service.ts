import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { Admin } from '../../entity/admin.entity';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  private readonly logger = new Logger('AdminAuthService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
  ) {}

  async onModuleInit() {
    const existing = await this.adminModel.findOne({ role: 'superadmin' });
    if (existing) return;

    const email = (this.config.get<string>('ADMIN_EMAIL') || 'admin@datingapp.com')
      .toLowerCase()
      .trim();
    const password = this.config.get<string>('ADMIN_PASSWORD') || 'admin123';
    const name = this.config.get<string>('ADMIN_NAME') || 'Super Admin';

    const hash = await bcrypt.hash(password, 10);
    await this.adminModel.create({
      name,
      email,
      password: hash,
      role: 'superadmin',
      is_active: true,
    });
    this.logger.log(`Seeded super-admin: ${email} (password: ${password})`);
  }

  async login(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email: email.toLowerCase().trim() });
    if (!admin) throw new UnauthorizedException('Invalid email or password');
    if (!admin.is_active) throw new UnauthorizedException('This admin account is disabled');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    admin.last_login = new Date();
    await admin.save();

    return this.issueToken(admin);
  }

  async me(adminId: string) {
    const admin = await this.adminModel.findById(adminId).select('-password').lean();
    if (!admin) throw new UnauthorizedException('Admin not found');
    return admin;
  }

  private issueToken(admin: Admin) {
    const payload = {
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
    return {
      token: this.jwtService.sign(payload),
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}
