import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { GovernanceController } from './governance.controller';
import { LearnerAnalyticsService } from './learner/learner-analytics.service';
import { TeacherAnalyticsService } from './teacher/teacher-analytics.service';
import { ContentAnalyticsService } from './content/content-analytics.service';
import { CurriculumAnalyticsService } from './curriculum/curriculum-analytics.service';
import { AdaptiveAnalyticsService } from './adaptive/adaptive-analytics.service';
import { AiAnalyticsService } from './ai/ai-analytics.service';
import { GovernanceService } from './governance/governance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentIntelligenceModule } from '../content-intelligence/content-intelligence.module';
import { AiModule } from '../ai/ai.module';
import { CognitiveTwinModule } from '../cognitive-twin/cognitive-twin.module';

@Module({
  imports: [PrismaModule, ContentIntelligenceModule, AiModule, CognitiveTwinModule],
  providers: [
    AnalyticsService,
    LearnerAnalyticsService,
    TeacherAnalyticsService,
    ContentAnalyticsService,
    CurriculumAnalyticsService,
    AdaptiveAnalyticsService,
    AiAnalyticsService,
    GovernanceService,
  ],
  controllers: [AnalyticsController, GovernanceController],
  exports: [
    AnalyticsService,
    LearnerAnalyticsService,
    TeacherAnalyticsService,
    ContentAnalyticsService,
    CurriculumAnalyticsService,
    AdaptiveAnalyticsService,
    AiAnalyticsService,
    GovernanceService,
  ],
})
export class AnalyticsModule {}
