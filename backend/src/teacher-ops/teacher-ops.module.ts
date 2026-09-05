import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LearningLoopModule } from '../learning-loop/learning-loop.module';
import { TeacherOpsController } from './teacher-ops.controller';
import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { Student360Service } from './services/student-360.service';
import { TeacherRecommendationService } from './services/teacher-recommendation.service';
import { TeacherInterventionOpsService } from './services/teacher-intervention-ops.service';
import { TeacherContentOpsService } from './services/teacher-content-ops.service';
import { TeacherAnalyticsOpsService } from './services/teacher-analytics-ops.service';

@Module({
  imports: [PrismaModule, AuthModule, LearningLoopModule],
  controllers: [TeacherOpsController],
  providers: [
    TeacherDashboardService,
    Student360Service,
    TeacherRecommendationService,
    TeacherInterventionOpsService,
    TeacherContentOpsService,
    TeacherAnalyticsOpsService,
  ],
  exports: [
    TeacherDashboardService,
    Student360Service,
    TeacherRecommendationService,
    TeacherInterventionOpsService,
    TeacherContentOpsService,
    TeacherAnalyticsOpsService,
  ],
})
export class TeacherOpsModule {}
