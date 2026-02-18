import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Patch,
	Delete,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	async create(@Body() dto: CreateUserDto) {
		try {
			return await this.userService.create(dto);
		} catch (err) {
			throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
		}
	}

	@Get()
	async findAll() {
		return await this.userService.findAll();
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.userService.findOne(id);
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
		return await this.userService.update(id, dto);
	}

	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.userService.remove(id);
	}
}
