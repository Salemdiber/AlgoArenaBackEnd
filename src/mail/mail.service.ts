import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendResetPasswordEmail(to: string, resetLink: string) {
    // For development/testing, log the email instead of sending
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== RESET PASSWORD EMAIL ===');
      console.log(`To: ${to}`);
      console.log(`Subject: Reset Password`);
      console.log(`Reset Link: ${resetLink}`);
      console.log('============================');
      return;
    }

    await this.transporter.sendMail({
      from: `"AlgoArena" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Reset Password',
      html: `
        <h3>Reset your password 🔐</h3>
        <p>Click the link below (valid for ${process.env.RESET_TOKEN_EXPIRE_MIN || 15} minutes):</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });
  }
}
