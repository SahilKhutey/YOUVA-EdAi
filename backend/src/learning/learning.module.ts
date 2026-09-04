import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [AiModule, PrismaModule, GamificationModule],
  providers: [LearningService],
  controllers: [LearningController],
})
export class LearningModule {}
