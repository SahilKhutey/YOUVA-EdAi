import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Req,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { LearnerAnalyticsService } from './learner/learner-analytics.service';
import { TeacherAnalyticsService } from './teacher/teacher-analytics.service';
import { ContentAnalyticsService } from './content/content-analytics.service';
import { CurriculumAnalyticsService } from './curriculum/curriculum-analytics.service';
import { AdaptiveAnalyticsService } from './adaptive/adaptive-analytics.service';
import { AiAnalyticsService } from './ai/ai-analytics.service';
import { GovernanceService } from './governance/governance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller(['v1/analytics', 'analytics'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly learnerAnalytics: LearnerAnalyticsService,
    private readonly teacherAnalytics: TeacherAnalyticsService,
    private readonly contentAnalytics: ContentAnalyticsService,
    private readonly curriculumAnalytics: CurriculumAnalyticsService,
    private readonly adaptiveAnalytics: AdaptiveAnalyticsService,
    private readonly aiAnalytics: AiAnalyticsService,
    private readonly governanceService: GovernanceService,
  ) {}

  // ==========================================================================
  // LKC-8: STUDENT ANALYTICS
  // ==========================================================================

  @Get('me')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getMe(@Req() req: any) {
    const learnerId = req.user.id || req.user.userId;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.learnerAnalytics.getLearnerOverview(learnerId, tenantId);
  }

  @Get('me/mastery')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getMeMastery(@Req() req: any) {
    const learnerId = req.user.id || req.user.userId;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.learnerAnalytics.getLearnerMastery(learnerId, tenantId);
  }

  // ==========================================================================
  // LKC-8: TEACHER ANALYTICS
  // ==========================================================================

  @Get('class/:classId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getClassOverview(@Param('classId') classId: string, @Req() req: any) {
    const teacherId = req.user.id || req.user.userId;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.teacherAnalytics.getClassOverview(classId, teacherId, tenantId);
  }

  @Get('learner/:learnerId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getLearnerDrilldown(@Param('learnerId') learnerId: string, @Req() req: any) {
    const teacherId = req.user.id || req.user.userId;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.teacherAnalytics.getLearnerDrilldown(learnerId, teacherId, tenantId);
  }

  // ==========================================================================
  // LKC-8: CONTENT & CURRICULUM ANALYTICS
  // ==========================================================================

  @Get('knowledge/:knowledgeId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getContentAnalytics(@Param('knowledgeId') knowledgeId: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.contentAnalytics.getContentAnalytics(knowledgeId, tenantId);
  }

  @Get('curriculum/:curriculumId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getCurriculumAnalytics(@Param('curriculumId') curriculumId: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.curriculumAnalytics.getCurriculumAnalytics(curriculumId, tenantId);
  }

  // ==========================================================================
  // LKC-8: ADAPTIVE & AI ANALYTICS
  // ==========================================================================

  @Get('adaptive')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getAdaptiveMetrics(@Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.adaptiveAnalytics.getAdaptiveMetrics(tenantId);
  }

  @Get('adaptive/decisions/:decisionId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getDecisionAuditTrace(@Param('decisionId') decisionId: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.adaptiveAnalytics.getDecisionAuditTrace(decisionId, tenantId);
  }

  @Get('ai')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getAiMetrics(@Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiAnalytics.getAiMetrics(tenantId);
  }

  @Post('ai/evaluation')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async runAiEvaluation(@Req() req: any, @Body() body: { suiteName?: string }) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.aiAnalytics.runEvaluationRegression(body?.suiteName, tenantId);
  }

  // ==========================================================================
  // LKC-8: GOVERNED EXPORTS
  // ==========================================================================

  @Post('exports')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async createExport(
    @Req() req: any,
    @Body()
    body: {
      reportType: string;
      scopeId?: string;
      format?: string;
    },
  ) {
    const requesterId = req.user.id || req.user.userId;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.createExport(
      requesterId,
      body.reportType,
      body.scopeId,
      body.format || 'CSV',
      tenantId,
    );
  }

  // ==========================================================================
  // LEGACY ROUTES (Backwards-Compatible)
  // ==========================================================================

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.analyticsService.getSummary(req.user.id || req.user.userId);
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req: any) {
    return this.analyticsService.getDashboardStats(req.user.id || req.user.userId);
  }

  @Get('weak-topics')
  async getWeakTopics(@Request() req: any) {
    return this.analyticsService.getWeakTopics(req.user.id || req.user.userId);
  }

  @Get('upcoming-tests')
  async getUpcomingTests(@Request() req: any) {
    return this.analyticsService.getUpcomingTests(req.user.id || req.user.userId);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req: any) {
    return this.analyticsService.getRecommendations(req.user.id || req.user.userId);
  }

  @Get('ai-report')
  async getAiReport(@Request() req: any) {
    return this.analyticsService.generateAIPerformanceReport(req.user.id || req.user.userId);
  }

  @Get('subject-breakdown')
  async getSubjectBreakdown(@Request() req: any) {
    return this.analyticsService.getSubjectBreakdown(req.user.id || req.user.userId);
  }

  @Get('recent-sessions')
  async getRecentSessions(@Request() req: any) {
    return this.analyticsService.getRecentSessions(req.user.id || req.user.userId);
  }

  @Get('heatmap')
  async getHeatmap(@Request() req: any) {
    return this.analyticsService.getActivityHeatmap(req.user.id || req.user.userId);
  }
}
