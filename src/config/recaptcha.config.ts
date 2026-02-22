import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaConfig {
  constructor(private configService: ConfigService) {}

  getSecretKey(): string {
    return this.configService.get<string>('RECAPTCHA_SECRET') || '';
  }

  getSiteKey(): string {
    return this.configService.get<string>('RECAPTCHA_SITE_KEY') || '';
  }

  getApiEndpoint(): string {
    return 'https://www.google.com/recaptcha/api/siteverify';
  }
}
