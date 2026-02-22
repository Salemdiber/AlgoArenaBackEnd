import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import * as fs from 'fs';
import { resolve } from 'path';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<any>) { }

  private ensureValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user id');
    }
  }

  private async safeDeleteAvatar(avatarRelativePath: string): Promise<void> {
    const uploadsDir = resolve(process.cwd(), 'uploads');
    const fullPath = resolve(process.cwd(), avatarRelativePath.replace(/^\//, ''));
    // Ensure the resolved path is within the uploads directory
    if (!fullPath.startsWith(uploadsDir + '/') && !fullPath.startsWith(uploadsDir + '\\')) {
      return;
    }
    try {
      await fs.promises.unlink(fullPath);
    } catch {
      // File may have been removed already — safe to ignore
    }
  }

  async create(dto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const created = await this.userModel.create({
      username: dto.username,
      passwordHash,
      email: dto.email,
      role: dto.role ?? 'Player',
      avatar: dto.avatar ?? null,
      bio: dto.bio ?? null,
      status: true,
    });
    return created.toObject();
  }

  async findAll() {
    return this.userModel.find().lean().exec();
  }

  async findOne(id: string) {
    this.ensureValidObjectId(id);
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, partial: Partial<CreateUserDto>) {
    this.ensureValidObjectId(id);
    const update: any = {};
    if (partial.username) update.username = partial.username;
    if (partial.email) update.email = partial.email;
    if (partial.avatar !== undefined) update.avatar = partial.avatar;
    if (partial.bio !== undefined) update.bio = partial.bio;
    if (partial.role) update.role = partial.role;
    if (partial.password) {
      const salt = await bcrypt.genSalt(10);
      update.passwordHash = await bcrypt.hash(partial.password, salt);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    this.ensureValidObjectId(id);
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('User not found');
    return { removed: true };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean().exec();
  }

  async setResetToken(email: string, token: string, expires: Date) {
    return this.userModel.findOneAndUpdate(
      { email },
      { resetToken: token, resetTokenExpires: expires },
      { new: true }
    ).lean().exec();
  }

  async verifyResetToken(token: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    }).lean().exec();
    return !!user;
  }

  async resetPassword(token: string, newPassword: string, oldPassword?: string) {
    const user: any = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    }).lean().exec();

    if (!user) return null;

    if (oldPassword) {
      const isBcrypt = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');
      let isMatch = false;

      if (isBcrypt) {
        isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      } else {
        const hash = crypto.createHash('sha256').update(oldPassword).digest('hex');
        isMatch = (user.passwordHash === hash);
      }

      if (!isMatch) {
        throw new BadRequestException('Invalid old password');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    return this.userModel.findOneAndUpdate(
      { _id: user._id },
      { passwordHash, resetToken: null, resetTokenExpires: null },
      { new: true }
    ).lean().exec();
  }

  // ── Account Settings ─────────────────────────────────────────────────────

  async getMyProfile(userId: string): Promise<any> {
    this.ensureValidObjectId(userId);
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash: _omit, ...rest } = user as any;
    return rest;
  }

  async updateAvatar(userId: string, filename: string): Promise<{ message: string; avatarUrl: string }> {
    this.ensureValidObjectId(userId);
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    // Remove old avatar file from disk if one exists
    if ((user as any).avatar) {
      await this.safeDeleteAvatar((user as any).avatar);
    }

    const avatarPath = `/uploads/avatars/${filename}`;
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('User not found');

    return { message: 'Avatar updated successfully', avatarUrl: avatarPath };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    this.ensureValidObjectId(userId);
    if (
      dto.username === undefined
      && dto.email === undefined
      && dto.bio === undefined
    ) {
      throw new BadRequestException('At least one field is required: username, email, or bio');
    }

    if (dto.username) {
      const conflict = await this.userModel.findOne({ username: dto.username }).lean().exec();
      if (conflict && (conflict as any)._id.toString() !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    if (dto.email) {
      const conflict = await this.userModel.findOne({ email: dto.email }).lean().exec();
      if (conflict && (conflict as any)._id.toString() !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const update: Record<string, any> = {};
    if (dto.username !== undefined) update.username = dto.username;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.bio !== undefined) update.bio = dto.bio;

    const updated = await this.userModel
      .findByIdAndUpdate(userId, update, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('User not found');

    const { passwordHash: _omit, ...rest } = updated as any;
    return rest;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    this.ensureValidObjectId(userId);
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('newPassword and confirmPassword do not match');
    }

    const isBcrypt = (user as any).passwordHash.startsWith('$2a$') || (user as any).passwordHash.startsWith('$2b$');
    let isMatch = false;

    if (isBcrypt) {
      isMatch = await bcrypt.compare(dto.currentPassword, (user as any).passwordHash);
    } else {
      const currentHash = crypto.createHash('sha256').update(dto.currentPassword).digest('hex');
      isMatch = ((user as any).passwordHash === currentHash);
    }

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);
    await this.userModel.findByIdAndUpdate(userId, { passwordHash: newHash }).exec();

    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<{ message: string }> {
    this.ensureValidObjectId(userId);
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('User not found');

    const isBcrypt = (user as any).passwordHash.startsWith('$2a$') || (user as any).passwordHash.startsWith('$2b$');
    let isMatch = false;

    if (isBcrypt) {
      isMatch = await bcrypt.compare(dto.password, (user as any).passwordHash);
    } else {
      const hash = crypto.createHash('sha256').update(dto.password).digest('hex');
      isMatch = ((user as any).passwordHash === hash);
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    // Remove avatar from disk if it exists
    if ((user as any).avatar) {
      await this.safeDeleteAvatar((user as any).avatar);
    }

    await this.userModel.findByIdAndDelete(userId).exec();
    return { message: 'Account deleted successfully' };
  }
}
