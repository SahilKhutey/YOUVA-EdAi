import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';

import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { LearningEngineModule } from '../learning-engine/learning-engine.module';
import { ConsentModule } from '../consent/consent.module';

@Module({
  imports: [AiModule, PrismaModule, GamificationModule, LearningEngineModule, ConsentModule],
  providers: [PracticeService],
  controllers: [PracticeController],
})
export class PracticeModule {}
