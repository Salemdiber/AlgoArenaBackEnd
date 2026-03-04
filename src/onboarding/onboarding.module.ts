import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { SettingsModule } from '../settings/settings.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SettingsModule, AiModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
