import { Injectable } from '@nestjs/common';
import twilio from 'twilio';
import type { Twilio } from 'twilio';

@Injectable()
export class TwoFactorSmsService {
  private client: Twilio | null = null;

  private getClient(): Twilio {
    if (this.client) return this.client;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio config: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    this.client = twilio(accountSid, authToken);
    return this.client;
  }

  async sendTwoFactorCode(phoneNumber: string, code: string): Promise<void> {
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
      throw new Error('Missing TWILIO_PHONE_NUMBER for sending SMS');
    }

    await this.getClient().messages.create({
      body: `Your verification code is: ${code}`,
      from,
      to: phoneNumber,
    });
  }
}
