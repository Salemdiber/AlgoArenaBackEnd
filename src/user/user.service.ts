import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User, Role } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

type StoredUser = Omit<User, 'userId'> & { userId: string };

@Injectable()
export class UserService {
	private users = new Map<string, StoredUser>();

	create(dto: CreateUserDto) {
		const id = randomUUID();
		const nowUser: StoredUser = {
			userId: id,
			username: dto.username,
			// simple SHA-256 hash for the example (not a substitute for bcrypt)
			passwordHash: require('crypto').createHash('sha256').update(dto.password).digest('hex'),
			email: dto.email,
			role: dto.role ?? Role.Player,
			avatar: dto.avatar ?? null,
			bio: dto.bio ?? null,
			status: true,
		};
		this.users.set(id, nowUser);
		return { ...nowUser };
	}

	findAll() {
		return Array.from(this.users.values()).map(u => ({ ...u }));
	}

	findOne(id: string) {
		const user = this.users.get(id);
		if (!user) throw new NotFoundException('User not found');
		return { ...user };
	}

	update(id: string, partial: Partial<CreateUserDto>) {
		const user = this.users.get(id);
		if (!user) throw new NotFoundException('User not found');
		const updated: StoredUser = {
			...user,
			username: partial.username ?? user.username,
			email: partial.email ?? user.email,
			avatar: partial.avatar ?? user.avatar,
			bio: partial.bio ?? user.bio,
			role: partial.role ?? user.role,
			// if password provided, re-hash it
			passwordHash: partial.password
				? require('crypto').createHash('sha256').update(partial.password).digest('hex')
				: user.passwordHash,
		};
		this.users.set(id, updated);
		return { ...updated };
	}

	remove(id: string) {
		const existed = this.users.delete(id);
		if (!existed) throw new NotFoundException('User not found');
		return { removed: true };
	}
}
