import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 2525),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendResetPasswordEmail(to: string, resetLink: string) {
    try {
      console.log("📧 Sending reset password email to:", to);
      console.log("🔗 Reset link:", resetLink);

      const mailResponse = await this.transporter.sendMail({
        from: `"AlgoArena" <${process.env.MAIL_USER}>`,
        to,
        subject: '🔐 Reset Your Password - AlgoArena',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
              <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p style="color: #666; font-size: 14px;">Hi,</p>
                <p style="color: #666;">We received a request to reset your password. Click the button below to proceed:</p>
                
                <div style="margin: 30px 0;">
                  <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #999; font-size: 12px;">Or copy this link: <a href="${resetLink}" style="color: #007bff;">${resetLink}</a></p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="color: #999; font-size: 12px;">This link will expire in 15 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                
                <footer style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                  © 2026 AlgoArena. All rights reserved.
                </footer>
              </div>
            </body>
          </html>
        `,
      });

      console.log("✅ Email sent successfully:", mailResponse.response);
      return { success: true, message: 'Reset email sent successfully' };
    } catch (error) {
      console.error("❌ Email sending failed:", error);
      throw new Error(`Failed to send reset password email: ${error.message}`);
    }
  }
}