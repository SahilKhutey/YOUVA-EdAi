import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AiModule } from './ai/ai.module';
import { LearningModule } from './learning/learning.module';
import { PracticeModule } from './practice/practice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RevisionModule } from './revision/revision.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BoardModule } from './board/board.module';
import { ContentIntelligenceModule } from './content-intelligence/content-intelligence.module';
import { GamificationModule } from './gamification/gamification.module';
import { LearningEngineModule } from './learning-engine/learning-engine.module';
import { AiMentorModule } from './ai-mentor/ai-mentor.module';
import { AssessmentModule } from './assessment/assessment.module';
import { EngagementModule } from './engagement/engagement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
    SubjectsModule,
    AiModule,
    LearningModule,
    PracticeModule,
    DashboardModule,
    RevisionModule,
    AnalyticsModule,
    SubscriptionModule,
    BoardModule,
    ContentIntelligenceModule,
    GamificationModule,
    LearningEngineModule,
    AiMentorModule,
    AssessmentModule,
    EngagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
