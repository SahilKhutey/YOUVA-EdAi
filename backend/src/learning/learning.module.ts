import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { LearnersController } from './controllers/learners.controller';
import { LearningTransactionService } from './services/learning-transaction.service';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { LearningLoopModule } from '../learning-loop/learning-loop.module';
import { LearningEngineModule } from '../learning-engine/learning-engine.module';

@Module({
  imports: [
    AiModule,
    PrismaModule,
    GamificationModule,
    LearningLoopModule,
    LearningEngineModule,
  ],
  providers: [LearningService, LearningTransactionService],
  controllers: [LearningController, LearnersController],
  exports: [LearningService, LearningTransactionService],
})
export class LearningModule {}
