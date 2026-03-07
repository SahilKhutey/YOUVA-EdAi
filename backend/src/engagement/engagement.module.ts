import { Module } from '@nestjs/common';
import { EngagementController } from './engagement.controller';
import { EmotionScoringService } from './services/emotion-scoring.service';
import { InterventionService } from './services/intervention.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LearningModule } from '../learning/learning.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, LearningModule, NotificationModule],
  controllers: [EngagementController],
  providers: [EmotionScoringService, InterventionService],
  exports: [EmotionScoringService, InterventionService],
})
export class EngagementModule { }
