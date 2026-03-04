import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
