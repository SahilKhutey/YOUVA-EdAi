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
import { ContentGenModule } from './content-gen/content-gen.module';
import { TeacherAnalyticsModule } from './teacher-analytics/teacher-analytics.module';
import { NotificationModule } from './notification/notification.module';
import { ForumModule } from './forum/forum.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { GoalModule } from './goal/goal.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CognitiveTwinModule } from './cognitive-twin/cognitive-twin.module';
import { KnowledgeGraphModule } from './knowledge-graph/knowledge-graph.module';
import { CredentialMeshModule } from './credential-mesh/credential-mesh.module';
import { AssessmentIntelligenceModule } from './assessment-intelligence/assessment-intelligence.module';
import { EdgeSyncModule } from './edge-sync/edge-sync.module';
import { ClassroomModule } from './classroom/classroom.module';
import { FeedbackModule } from './feedback/feedback.module';
import { LearningLoopModule } from './learning-loop/learning-loop.module';
import { TeacherOpsModule } from './teacher-ops/teacher-ops.module';

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
    ContentGenModule,
    TeacherAnalyticsModule,
    NotificationModule,
    ForumModule,
    SchedulerModule,
    GoalModule,
    AnnouncementModule,
    NotificationsModule,
    CognitiveTwinModule,
    KnowledgeGraphModule,
    CredentialMeshModule,
    AssessmentIntelligenceModule,
    ClassroomModule,
    FeedbackModule,
    LearningLoopModule,
    TeacherOpsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
