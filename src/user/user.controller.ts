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
	UseGuards,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMAGE_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const avatarStorage = diskStorage({
	destination: (_req, _file, cb) => {
		const dir = join(process.cwd(), 'uploads', 'avatars');
		mkdirSync(dir, { recursive: true });
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		const ext = extname(file.originalname).toLowerCase();
		cb(null, `${(req as any).user.userId}-${Date.now()}${ext}`);
	},
});

const imageFileFilter = (
	_req: any,
	file: Express.Multer.File,
	cb: (error: Error | null, acceptFile: boolean) => void,
) => {
	const ext = extname(file.originalname).toLowerCase();
	if (!ALLOWED_IMAGE_TYPES.includes(ext) || !ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
		return cb(
			new BadRequestException('Only image files are allowed (jpg, jpeg, png, webp)'),
			false,
		);
	}
	cb(null, true);
};

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) { }

	// ── Account Settings (must be declared before /:id routes) ───────────────

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async getMyProfile(@CurrentUser() user: { userId: string }) {
		return this.userService.getMyProfile(user?.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('me/avatar')
	@UseInterceptors(
		FileInterceptor('avatar', {
			storage: avatarStorage,
			fileFilter: imageFileFilter,
			limits: { fileSize: MAX_FILE_SIZE },
		}),
	)
	async uploadAvatar(
		@CurrentUser() user: { userId: string },
		@UploadedFile() file: Express.Multer.File,
	) {
		if (!file) {
			throw new BadRequestException('Avatar file is required');
		}
		return this.userService.updateAvatar(user.userId, file.filename);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('me/password')
	@HttpCode(HttpStatus.OK)
	async changePassword(
		@CurrentUser() user: { userId: string },
		@Body() dto: ChangePasswordDto,
	) {
		return this.userService.changePassword(user.userId, dto);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('me')
	async updateProfile(
		@CurrentUser() user: { userId: string },
		@Body() dto: UpdateProfileDto,
	) {
		return this.userService.updateProfile(user.userId, dto);
	}

	@UseGuards(JwtAuthGuard)
	@Delete('me')
	async deleteAccount(
		@CurrentUser() user: { userId: string },
		@Body() dto: DeleteAccountDto,
	) {
		return this.userService.deleteAccount(user.userId, dto);
	}

	// ── Existing CRUD endpoints ───────────────────────────────────────────────

	@UseGuards(JwtAuthGuard)
	@Post('admin')
	async createAdmin(@Body() dto: CreateUserDto) {
		try {
			return await this.userService.create({ ...dto, role: 'Admin' as any });
		} catch (err) {
			throw new HttpException('Failed to create admin', HttpStatus.BAD_REQUEST);
		}
	}

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

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
		return await this.userService.update(id, dto);
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	async remove(@Param('id') id: string) {
		return await this.userService.remove(id);
	}
}
