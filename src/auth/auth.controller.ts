import { Body, Controller, Post, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

class LoginDto {
	@IsString()
	username: string;

	@IsString()
	password: string;
}

class Verify2FaDto {
	@IsString()
	@Transform(({ value }) => (value != null ? String(value) : value))
	userId: string;

	@IsString()
	@Transform(({ value }) => (value != null ? String(value) : value))
	code: string;
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

	@Post('verify-2fa')
	async verify2Fa(@Body() body: Verify2FaDto) {
		if (!body?.userId || !body?.code) throw new BadRequestException('userId and code are required');
		return this.authService.verifyTwoFactor(body.userId, body.code);
	}
}
