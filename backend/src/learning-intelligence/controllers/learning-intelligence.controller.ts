import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LearningIntelligenceService } from '../services/learning-intelligence.service';
import { CreateExperimentDto } from '../services/experiment.service';

@Controller('v1/learning-intelligence')
export class LearningIntelligenceController {
  constructor(private readonly intelligenceService: LearningIntelligenceService) {}

  // ============================================================================
  // Teacher Continuous Improvement Endpoints
  // ============================================================================

  @Get('teacher/overview')
  async getTeacherOverview(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.getTeacherOverview(tenantId);
  }

  @Get('teacher/insights')
  async getInsights(
    @Query('scope') scope?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const tenantId = req?.user?.tenantId || 'default-tenant';
    return this.intelligenceService.insightEngine['prisma'].learningInsight.findMany({
      where: {
        tenantId,
        ...(scope ? { scope } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { detectedAt: 'desc' },
    });
  }

  @Get('teacher/opportunities')
  async getOpportunities(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.recommendationService['prisma'].improvementOpportunity.findMany({
      where: { tenantId, status: 'OPEN' },
      orderBy: { priority: 'desc' },
    });
  }

  @Get('teacher/recommendations')
  async getRecommendations(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.recommendationService['prisma'].improvementRecommendation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('teacher/recommendations/:id/accept')
  async acceptRecommendation(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.recommendationService.acceptRecommendation(id, tenantId);
  }

  @Post('teacher/recommendations/:id/dismiss')
  async dismissRecommendation(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.recommendationService.dismissRecommendation(id, tenantId);
  }

  // ============================================================================
  // Knowledge Quality Intelligence
  // ============================================================================

  @Get('knowledge/:id/quality')
  async getKnowledgeQuality(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.knowledgeQuality.getQualityProfile(id, tenantId);
  }

  // ============================================================================
  // Curriculum Intelligence & Path Quality
  // ============================================================================

  @Get('curriculum/:id/coverage')
  async getCurriculumCoverage(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.curriculumIntelligence.getCurriculumCoverage(id, tenantId);
  }

  @Get('curriculum/:id/path-quality')
  async getPathQuality(
    @Param('id') id: string,
    @Query('concepts') conceptsStr: string,
    @Request() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const conceptIds = conceptsStr ? conceptsStr.split(',') : [];
    return this.intelligenceService.curriculumIntelligence.getPathQuality(id, conceptIds, tenantId);
  }

  // ============================================================================
  // Controlled Experimentation Endpoints
  // ============================================================================

  @Get('experiments')
  async getExperiments(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.experimentService['prisma'].intelligenceExperiment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('experiments')
  async createExperiment(@Body() dto: CreateExperimentDto, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const ownerId = req.user?.id || dto.ownerId || 'system-teacher';
    return this.intelligenceService.experimentService.createExperiment({ ...dto, ownerId }, tenantId);
  }

  @Post('experiments/:id/submit')
  async submitExperiment(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.experimentService.submitForApproval(id, tenantId);
  }

  @Post('experiments/:id/approve')
  async approveExperiment(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const approvedBy = req.user?.id || 'admin-approver';
    return this.intelligenceService.experimentService.approveExperiment(id, approvedBy, tenantId);
  }

  @Post('experiments/:id/start')
  async startExperiment(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.experimentService.startExperiment(id, tenantId);
  }

  @Post('experiments/:id/pause')
  async pauseExperiment(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.experimentService.pauseExperiment(id, tenantId);
  }

  @Post('experiments/:id/complete')
  async completeExperiment(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.experimentService.completeExperiment(id, tenantId);
  }

  // ============================================================================
  // Governance & AI Oversight Endpoints
  // ============================================================================

  @Get('governance/ai-metrics')
  async getAiMetrics(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.intelligenceService.governanceService.getAiGovernanceMetrics(tenantId);
  }
}
