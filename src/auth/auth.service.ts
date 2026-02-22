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
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

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

      // Vérifier le score si nécessaire (reCAPTCHA v3)
      if (response.data.score < 0.5) {
        throw new UnauthorizedException('Captcha score too low');
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
    const isHuman = await this.verifyCaptcha(dto.captchaToken);
    if (!isHuman) {
      throw new UnauthorizedException('Captcha validation failed');
    }

    return this.users.create(dto);
  }

  // 🔎 VALIDATE USER
  async validateUser(username: string, password: string) {
    if (!password) return null;

    const users = await this.users.findAll();
    const user = users.find((u) => u.username === username);

    if (user) {
      // Compatibility with old crypto hashes and new bcrypt hashes
      const isBcrypt = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');
      let isMatch = false;

      if (isBcrypt) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        const passwordHash = crypto
          .createHash('sha256')
          .update(password)
          .digest('hex');
        isMatch = (user.passwordHash === passwordHash);
      }

      if (isMatch) {
        const { passwordHash: _ph, ...rest } = user as any;
        return rest;
      }
    }

    return null;
  }

  // 🔑 LOGIN (with reCAPTCHA verification)
  async login(user: any, captchaToken: string) {
    const isHuman = await this.verifyCaptcha(captchaToken);
    if (!isHuman) {
      throw new UnauthorizedException('Captcha validation failed');
    }

    if (!user) throw new UnauthorizedException();

    const payload = {
      sub: user._id || user.userId || user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 🔑 LOGIN OAUTH (without reCAPTCHA, for Google/GitHub OAuth)
  async loginOAuth(user: any) {
    if (!user) throw new UnauthorizedException();
    const rawId = user._id || user.userId || user.id;
    const sub = rawId ? rawId.toString() : '';
    const payload = { sub, username: user.username, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  // 🌐 VALIDATE OAUTH LOGIN (Google / GitHub)
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
    const isHuman = await this.verifyCaptcha(captchaToken);
    if (!isHuman) {
      throw new UnauthorizedException('Captcha validation failed');
    }

    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarder le token en base de données
    await this.users.setResetToken(email, token, expiresAt);

    // Créer le lien de réinitialisation
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Envoyer l'email avec le lien complet
    await this.mailService.sendResetPasswordEmail(email, resetLink);

    return { message: 'Reset email sent successfully' };
  }

  // 🔍 VERIFY RESET TOKEN
  async verifyResetToken(token: string) {
    return this.users.verifyResetToken(token);
  }

  // 🔄 RESET PASSWORD
  async resetPassword(token: string, newPassword: string, oldPassword?: string) {
    const user = await this.users.resetPassword(token, newPassword, oldPassword);

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    return { message: 'Password reset successfully' };
  }
}