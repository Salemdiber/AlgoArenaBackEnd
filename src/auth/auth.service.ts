import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  // 🔐 Vérification reCAPTCHA v2
  private async verifyCaptcha(token: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('Captcha token is required');
    }

    try {
      const secretKey = this.configService.get<string>('RECAPTCHA_SECRET');
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
        },
      );

      if (!response.data.success) {
        throw new UnauthorizedException('Captcha validation failed');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Captcha verification error');
    }
  }

  // 📝 REGISTER
  async register(dto: any) {
    if (dto.captchaToken) {
      await this.verifyCaptcha(dto.captchaToken);
    }
    return this.users.create(dto);
  }

  // 🔎 VALIDATE USER
  async validateUser(username: string, password: string) {
    if (!password) return null;

    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const users = await this.users.findAll();
    // Find the most recently created account in case of duplicates
    const user = users.reverse().find((u) => u.username === username);

    if (user && user.passwordHash === passwordHash) {
      const { passwordHash: _ph, ...rest } = user as any;
      return rest;
    }

    return null;
  }

  // 🔑 LOGIN
  async login(user: any, captchaToken?: string) {
    if (!user) throw new UnauthorizedException();

    if (captchaToken) {
      await this.verifyCaptcha(captchaToken);
    }

    const rawId = user._id || user.userId || user.id;
    const sub = rawId ? rawId.toString() : '';
    const payload = { sub, username: user.username, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 🔗 OAUTH LOGIN
  async validateOAuthLogin(profile: any, provider: 'google' | 'github') {
    const users = await this.users.findAll();
    let user = users.find((u: any) =>
      (provider === 'google' && u.googleId === profile.id) ||
      (provider === 'github' && u.githubId === profile.id) ||
      (u.email === profile.email)
    );

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const dto: any = {
        username: profile.username || `${provider}_${profile.id}`,
        email: profile.email || `${profile.id}@${provider}.local`,
        password: randomPassword,
        role: 'Player',
        avatar: profile.avatar || null,
      };

      user = await this.users.create(dto);
    }

    const { passwordHash: _ph, ...rest } = user as any;
    return rest;
  }

  // 📧 FORGOT PASSWORD
  async forgotPassword(email: string, captchaToken: string) {
    await this.verifyCaptcha(captchaToken);

    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await this.users.setResetToken(email, token, expiresAt);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailService.sendResetPasswordEmail(email, resetLink);

    return { message: 'Reset email sent successfully' };
  }

  // 🔄 RESET PASSWORD
  async resetPassword(token: string, newPassword: string) {
    const user = await this.users.resetPassword(token, newPassword);

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    return { message: 'Password reset successfully' };
  }
}
