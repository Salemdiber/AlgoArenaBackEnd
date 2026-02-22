import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<any>) {}

  async create(dto: CreateUserDto) {
    const passwordHash = require('crypto').createHash('sha256').update(dto.password).digest('hex');
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
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, partial: Partial<CreateUserDto>) {
    const update: any = {};
    if (partial.username) update.username = partial.username;
    if (partial.email) update.email = partial.email;
    if (partial.avatar !== undefined) update.avatar = partial.avatar;
    if (partial.bio !== undefined) update.bio = partial.bio;
    if (partial.role) update.role = partial.role;
    if (partial.password) update.passwordHash = require('crypto').createHash('sha256').update(partial.password).digest('hex');

    const updated = await this.userModel.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async updateTwoFactorCode(id: string, twoFactorCode: string, twoFactorCodeExpires: Date) {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { twoFactorCode, twoFactorCodeExpires }, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async clearTwoFactorCode(id: string) {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { twoFactorCode: null, twoFactorCodeExpires: null }, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('User not found');
    return { removed: true };
  }
}
