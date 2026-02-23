import { Body, Controller, Post, Get, Req, Res, UnauthorizedException, BadRequestException, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import type { Response } from 'express';
import type { Request } from 'express';

class LoginDto {
	@IsString()
	username: string;

	@IsString()
	password: string;
}

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	@Post('register')
	async register(@Body() dto: CreateUserDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	async login(@Body() body: LoginDto, @Res() res: Response) {
		if (!body || !body.username || !body.password) throw new BadRequestException('username and password are required');
		const user = await this.authService.validateUser(body.username, body.password);
		if (!user) throw new UnauthorizedException('Invalid credentials');
		const tokens = await this.authService.login(user);
		// set refresh token as HttpOnly cookie
		res.cookie('refresh_token', tokens.refresh_token, {
			httpOnly: true,
			path: '/auth',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});
		return res.json({ access_token: tokens.access_token });
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {
		// initiates the Google OAuth flow
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleAuthRedirect(@Req() req, @Res() res: Response) {
		const tokens = await this.authService.login(req.user);
		res.cookie('refresh_token', tokens.refresh_token, { path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
		return res.redirect('http://localhost:5173/?access_token=' + tokens.access_token);
	}

	@Get('github')
	@UseGuards(AuthGuard('github'))
	async githubAuth() {
		// initiates the Github OAuth flow
	}

	@Get('github/callback')
	@UseGuards(AuthGuard('github'))
	async githubAuthRedirect(@Req() req, @Res() res: Response) {
		const tokens = await this.authService.login(req.user);
		res.cookie('refresh_token', tokens.refresh_token, { path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
		return res.redirect('http://localhost:5173/?access_token=' + tokens.access_token);
	}

	@Post('refresh')
	@HttpCode(200)
	async refresh(@Req() req: Request, @Res() res: Response) {
		const refreshToken = req.cookies?.refresh_token;
		if (!refreshToken) throw new UnauthorizedException('No refresh token');
		const tokens = await this.authService.refreshTokens(refreshToken);
		res.cookie('refresh_token', tokens.refresh_token, {
			httpOnly: true,
			path: '/auth',
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});
		return res.json({ access_token: tokens.access_token });
	}

	@Post('logout')
	@HttpCode(200)
	async logout(@Req() req: Request, @Res() res: Response) {
		const refreshToken = req.cookies?.refresh_token;
		if (refreshToken) await this.authService.logout(refreshToken);
		res.clearCookie('refresh_token', { path: '/auth' });
		return res.json({ ok: true });
	}
}
