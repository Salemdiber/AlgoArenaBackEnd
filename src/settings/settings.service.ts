import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  private settingsCache: any = null;
  private settingsCacheTime = 0;
  private readonly settingsTtlMs = 5 * 60 * 1000;

  constructor(@InjectModel('Settings') private settingsModel: Model<any>) {}

  /** Seed default settings document if none exists */
  async onModuleInit() {
    const count = await this.settingsModel.countDocuments().exec();
    if (count === 0) {
      await this.settingsModel.create({});
    }
  }

  async getSettings() {
    const now = Date.now();
    if (this.settingsCache && now - this.settingsCacheTime < this.settingsTtlMs) {
      return this.settingsCache;
    }

    const settings = await this.settingsModel.findOne().lean().exec();
    this.settingsCache = settings;
    this.settingsCacheTime = now;
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const settings = await this.settingsModel
      .findOneAndUpdate({}, { $set: dto }, { new: true })
      .lean()
      .exec();
    this.settingsCache = settings;
    this.settingsCacheTime = Date.now();
    return settings;
  }
}
