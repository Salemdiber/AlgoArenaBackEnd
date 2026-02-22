import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class TwoFactorEmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        'Missing email config: set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT)',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    return this.transporter;
  }

  async sendTwoFactorCode(email: string, code: string): Promise<void> {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    if (!from) {
      throw new Error('Missing MAIL_FROM or SMTP_USER for sender address');
    }

    const transport = this.getTransporter();
    await transport.sendMail({
      from,
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is: ${code}`,
      html: `<p>Your verification code is: <strong>${code}</strong></p>`,
    });
  }
}
