import { Body, Controller, Post, Get, Req, Res, UnauthorizedException, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import type { Response } from 'express';

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
	async login(@Body() body: LoginDto) {
		if (!body || !body.username || !body.password) throw new BadRequestException('username and password are required');
		const user = await this.authService.validateUser(body.username, body.password);
		if (!user) throw new UnauthorizedException('Invalid credentials');
		return this.authService.login(user);
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {
		// initiates the Google OAuth flow
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleAuthRedirect(@Req() req, @Res() res: Response) {
		const { access_token } = await this.authService.login(req.user);
		res.cookie('access_token', access_token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
		return res.redirect('http://localhost:5173/');
	}

	@Get('github')
	@UseGuards(AuthGuard('github'))
	async githubAuth() {
		// initiates the Github OAuth flow
	}

	@Get('github/callback')
	@UseGuards(AuthGuard('github'))
	async githubAuthRedirect(@Req() req, @Res() res: Response) {
		const { access_token } = await this.authService.login(req.user);
		res.cookie('access_token', access_token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
		return res.redirect('http://localhost:5173/');
	}
}
