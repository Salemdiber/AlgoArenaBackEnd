import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
