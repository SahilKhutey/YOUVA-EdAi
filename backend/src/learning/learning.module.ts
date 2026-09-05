import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

import { LearningLoopModule } from '../learning-loop/learning-loop.module';

@Module({
  imports: [AiModule, PrismaModule, GamificationModule, LearningLoopModule],
  providers: [LearningService],
  controllers: [LearningController],
})
export class LearningModule {}
