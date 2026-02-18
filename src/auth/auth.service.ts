import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
	constructor(private readonly users: UserService, private readonly jwtService: JwtService) {}

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
}
