import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { TwoFactorEmailService } from './twofactor-email.service';
import { TwoFactorSmsService } from './twofactor-sms.service';

const TWO_FACTOR_CODE_TTL_MS = 5 * 60 * 1000;

/** Mock user for 2FA testing without DB. Login: username "mock" / password "test123". Then use the code from server console in POST /auth/verify-2fa. */
const MOCK_2FA_USER_ID = 'mock-user-id';
const MOCK_2FA_USER = {
	_id: MOCK_2FA_USER_ID,
	username: 'mock',
	role: 'Player',
	twoFactorEnabled: true,
	email: 'mock@test.com',
	phoneNumber: null,
	twoFactorMethod: 'email' as const,
};

@Injectable()
export class AuthService {
	/** In-memory 2FA codes for mock user (no DB). */
	private mock2FACodes = new Map<string, { code: string; expires: Date }>();

	constructor(
		private readonly users: UserService,
		private readonly jwtService: JwtService,
		private readonly twoFactorEmail: TwoFactorEmailService,
		private readonly twoFactorSms: TwoFactorSmsService,
	) {}

	generateTwoFactorCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	isTwoFactorCodeExpired(user: { twoFactorCodeExpires?: Date | null }): boolean {
		if (!user?.twoFactorCodeExpires) return true;
		return new Date() > new Date(user.twoFactorCodeExpires);
	}

	async register(dto: any) {
		return this.users.create(dto);
	}

	async validateUser(username: string, password: string) {
		if (!password) return null;

		// Mock user for 2FA testing without database (e.g. Postman)
		if (username === 'mock' && password === 'test123') {
			return { ...MOCK_2FA_USER };
		}

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
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const userId = user._id ?? user.userId ?? user.id;

		if (!user.twoFactorEnabled) {
			const payload = { sub: userId, username: user.username, role: user.role };
			return { access_token: this.jwtService.sign(payload) };
		}

		const code = this.generateTwoFactorCode();
		const expires = new Date(Date.now() + TWO_FACTOR_CODE_TTL_MS);
		const userIdStr = userId.toString();

		// Mock 2FA: store code in memory instead of DB
		if (userIdStr === MOCK_2FA_USER_ID) {
			this.mock2FACodes.set(MOCK_2FA_USER_ID, { code, expires });
			console.log('[2FA mock] Use this code in POST /auth/verify-2fa:', code);
			return { requires2FA: true, userId: userIdStr };
		}

		await this.users.updateTwoFactorCode(userId, code, expires);
		if (user.twoFactorMethod === 'email') {
			await this.sendTwoFactorCodeToEmail(user.email, code);
		} else if (user.twoFactorMethod === 'sms' && user.phoneNumber) {
			await this.sendTwoFactorCodeToSms(user.phoneNumber, code);
		}
		return { requires2FA: true, userId: userIdStr };
	}

	private async sendTwoFactorCodeToEmail(email: string, code: string): Promise<void> {
		await this.twoFactorEmail.sendTwoFactorCode(email, code);
	}

	private async sendTwoFactorCodeToSms(phoneNumber: string, code: string): Promise<void> {
		await this.twoFactorSms.sendTwoFactorCode(phoneNumber, code);
	}

	async verifyTwoFactor(userId: string, code: string): Promise<{ accessToken: string }> {
		const userIdNorm = String(userId ?? '').trim();
		const codeStr = String(code ?? '').trim();

		// Mock 2FA: validate against in-memory code (or fixed dev code if map was lost e.g. after restart)
		if (userIdNorm === MOCK_2FA_USER_ID) {
			const stored = this.mock2FACodes.get(MOCK_2FA_USER_ID);
			const validFromMap = stored && stored.code === codeStr && new Date() <= stored.expires;
			const validDevCode = codeStr === '123456'; // fallback when no DB / map empty
			if (validFromMap || validDevCode) {
				this.mock2FACodes.delete(MOCK_2FA_USER_ID);
				const payload = { sub: MOCK_2FA_USER_ID, username: MOCK_2FA_USER.username, role: MOCK_2FA_USER.role };
				return { accessToken: this.jwtService.sign(payload) };
			}
			throw new UnauthorizedException('Invalid or expired code');
		}

		let user: any;
		try {
			user = await this.users.findOne(userIdNorm);
		} catch {
			throw new UnauthorizedException('Invalid or expired code');
		}
		if (!user.twoFactorCode) throw new UnauthorizedException('Invalid or expired code');
		if (user.twoFactorCode !== codeStr) throw new UnauthorizedException('Invalid or expired code');
		if (this.isTwoFactorCodeExpired(user)) throw new UnauthorizedException('Invalid or expired code');

		await this.users.clearTwoFactorCode(userIdNorm);
		const payload = { sub: user._id ?? user.userId ?? user.id, username: user.username, role: user.role };
		return { accessToken: this.jwtService.sign(payload) };
	}
}
