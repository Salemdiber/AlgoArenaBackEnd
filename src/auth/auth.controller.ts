import { Body, Controller, Post, Get, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto/forgot-password.dto';
import { ResetPasswordDto, VerifyResetTokenDto } from './dto/reset-password.dto/reset-password.dto';

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
}
