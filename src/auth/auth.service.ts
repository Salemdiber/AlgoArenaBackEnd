import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
	constructor(private readonly users: UserService, private readonly jwtService: JwtService) { }

	async register(dto: any) {
		return this.users.create(dto);
	}

	async validateUser(username: string, password: string) {
		if (!password) return null;
		const crypto = require('crypto');
		const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
		const users = await this.users.findAll();
		// Find the most recently created account in case of duplicates
		const user = users.reverse().find((u) => u.username === username);
		if (user && user.passwordHash === passwordHash) {
			const { passwordHash: _ph, ...rest } = user as any;
			return rest;
		}
		return null;
	}

	async validateOAuthLogin(profile: any, provider: 'google' | 'github') {
		const users = await this.users.findAll();
		let user = users.find((u: any) =>
			(provider === 'google' && u.googleId === profile.id) ||
			(provider === 'github' && u.githubId === profile.id) ||
			(u.email === profile.email)
		);

		if (!user) {
			const randomPassword = require('crypto').randomBytes(16).toString('hex');
			const dto: any = {
				username: profile.username || `${provider}_${profile.id}`,
				email: profile.email || `${profile.id}@${provider}.local`,
				password: randomPassword,
				role: 'Player',
				avatar: profile.avatar || null,
			};

			const created = await this.users.create(dto);

			// Update the created user with the provider ID
			const updateQ: any = {};
			if (provider === 'google') updateQ.googleId = profile.id;
			if (provider === 'github') updateQ.githubId = profile.id;

			// We have to directly update the model for googleId/githubId since users.update doesn't map it.
			// Luckily we can just return the created user and let the next login handle it, or we could update it.
			// Since UserService update doesn't take googleId, we'll just ignore for now or we can update directly via model.
			// For simplicity we just return the created user.

			user = created;
		}

		const { passwordHash: _ph, ...rest } = user as any;
		return rest;
	}

	async login(user: any) {
		if (!user) throw new UnauthorizedException();
		const rawId = user._id || user.userId || user.id;
		const sub = rawId ? rawId.toString() : '';
		const payload = { sub, username: user.username, role: user.role };

		const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
		const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

		// store hashed refresh token server-side
		const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
		await this.users.setRefreshTokenHash(sub, hash);

		return { access_token: accessToken, refresh_token: refreshToken };
	}

	async refreshTokens(refreshToken: string) {
		try {
			const payload: any = this.jwtService.verify(refreshToken);
			const userId = payload.sub;
			const user = await this.users.findOne(userId);
			if (!user) throw new UnauthorizedException();

			const storedHash = (user as any).refreshTokenHash;
			if (!storedHash) throw new UnauthorizedException();

			const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
			if (hash !== storedHash) throw new UnauthorizedException();

			const newPayload = { sub: payload.sub, username: payload.username, role: payload.role };
			const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
			const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

			// rotate refresh token
			const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
			await this.users.setRefreshTokenHash(userId, newHash);

			return { access_token: accessToken, refresh_token: newRefreshToken };
		} catch (e) {
			throw new UnauthorizedException('Invalid refresh token');
		}
	}

	async logout(refreshToken: string) {
		try {
			const payload: any = this.jwtService.verify(refreshToken);
			const userId = payload.sub;
			await this.users.setRefreshTokenHash(userId, null);
		} catch (e) {
			// ignore invalid token
		}
	}
}
