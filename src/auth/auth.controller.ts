import { Body, Controller, Post, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto/reset-password.dto';

class LoginDto {
	@IsString()
	username: string;

	@IsString()
	password: string;
}

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

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
		return this.authService.login(user);
	}

	@Post('forgot-password')
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.authService.forgotPassword(dto.email);
	}

	@Post('reset-password')
	async resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.newPassword);
	}
}
