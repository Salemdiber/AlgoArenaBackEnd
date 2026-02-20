import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
	constructor(private readonly users: UserService, private readonly jwtService: JwtService, private readonly mailService: MailService) {}

	async register(dto: any) {
		return this.users.create(dto);
	}

	async validateUser(username: string, password: string) {
		if (!password) return null;
		const crypto = require('crypto');
		const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
		const users = await this.users.findAll();
		const user = users.find((u) => u.username === username);
		if (user && user.passwordHash === passwordHash) {
			const { passwordHash: _ph, ...rest } = user as any;
			return rest;
		}
		return null;
	}

	async login(user: any) {
		if (!user) throw new UnauthorizedException();
		const payload = { sub: user._id || user.userId || user.id, username: user.username, role: user.role };
		return { access_token: this.jwtService.sign(payload) };
	}

	async forgotPassword(email: string) {
		const user = await this.users.findByEmail(email);
		if (!user) throw new Error('User not found');

		const resetToken = uuidv4();
		const resetTokenExpires = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes

		await this.users.setResetToken(email, resetToken, resetTokenExpires);

		const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
		await this.mailService.sendResetPasswordEmail(email, resetLink);

		return { message: 'Reset email sent' };
	}

	async resetPassword(token: string, newPassword: string) {
		const user = await this.users.resetPassword(token, newPassword);
		if (!user) throw new Error('Invalid or expired token');

		return { message: 'Password reset successfully' };
	}
}
