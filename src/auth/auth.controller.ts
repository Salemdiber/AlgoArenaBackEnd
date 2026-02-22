import { Body, Controller, Post, Get, Req, Res, Param, UnauthorizedException, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto/forgot-password.dto';
import { ResetPasswordDto, VerifyResetTokenDto } from './dto/reset-password.dto/reset-password.dto';
import type { Response } from 'express';

class LoginDto {
	@IsString()
	username: string;

	@IsString()
	password: string;

	@IsString()
	captchaToken: string;
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
		console.log('LOGIN BODY:', body);
		if (!body || !body.username || !body.password) throw new BadRequestException('username and password are required');
		const user = await this.authService.validateUser(body.username, body.password);
		if (!user) throw new UnauthorizedException('Invalid credentials');
		return this.authService.login(user, body.captchaToken);
	}

	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.authService.forgotPassword(dto.email, dto.recaptchaToken);
	}

	@Post('reset-password/verify')
	async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
		const isValid = await this.authService.verifyResetToken(dto.token);
		if (!isValid) {
			throw new BadRequestException('Invalid or expired token');
		}
		return { valid: true };
	}

	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.newPassword, dto.oldPassword);
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleAuth() {
		// initiates the Google OAuth flow
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleAuthRedirect(@Req() req, @Res() res: Response) {
		const { access_token } = await this.authService.loginOAuth(req.user);
		const isProduction = process.env.NODE_ENV === 'production';
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		res.cookie('access_token', access_token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax', httpOnly: true, secure: isProduction });
		return res.redirect(frontendUrl);
	}

	@Get('github')
	@UseGuards(AuthGuard('github'))
	async githubAuth() {
		// initiates the Github OAuth flow
	}

	@Get('github/callback')
	@UseGuards(AuthGuard('github'))
	async githubAuthRedirect(@Req() req, @Res() res: Response) {
		const { access_token } = await this.authService.loginOAuth(req.user);
		const isProduction = process.env.NODE_ENV === 'production';
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		res.cookie('access_token', access_token, { path: '/', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax', httpOnly: true, secure: isProduction });
		return res.redirect(frontendUrl);
	}
}
