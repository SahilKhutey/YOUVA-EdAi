import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LearningOperationsService } from './learning-operations.service';
import { LearningSignalService } from '../signals/signal.service';
import { RiskDetectionService } from '../risk/risk.service';
import { OpportunityDetectionService } from '../opportunity/opportunity.service';
import { InterventionOrchestratorService } from '../intervention/intervention-orchestrator.service';
import { InterventionEvaluationService } from '../evaluation/intervention-evaluation.service';
import { TeacherPriorityService } from '../teacher-priority/teacher-priority.service';
import { InstitutionalSignalService } from '../institutional/institutional.service';
import { PolicyRecommendationService } from '../policy/policy-recommendation.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/operations', 'v1/operations', 'operations'])
export class LearningOperationsController {
  constructor(
    private readonly operationsService: LearningOperationsService,
    private readonly signalService: LearningSignalService,
    private readonly riskService: RiskDetectionService,
    private readonly opportunityService: OpportunityDetectionService,
    private readonly interventionService: InterventionOrchestratorService,
    private readonly evaluationService: InterventionEvaluationService,
    private readonly teacherPriorityService: TeacherPriorityService,
    private readonly institutionalService: InstitutionalSignalService,
    private readonly policyService: PolicyRecommendationService,
  ) {}

  @Get('signals')
  @UseGuards(JwtAuthGuard)
  async getSignals(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.sub || req.user?.userId || 'default-user';
    return this.operationsService.getSignals({ tenantId, userId });
  }

  @Get('risks')
  @UseGuards(JwtAuthGuard)
  async getRisks(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const learnerId = req.user?.sub || req.user?.userId || 'default-learner';
    return this.riskService.evaluateLearnerRisk(learnerId, tenantId);
  }

  @Get('opportunities')
  @UseGuards(JwtAuthGuard)
  async getOpportunities(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const learnerId = req.user?.sub || req.user?.userId || 'default-learner';
    return this.opportunityService.detectOpportunities(learnerId, tenantId);
  }

  @Get('interventions')
  @UseGuards(JwtAuthGuard)
  async getInterventions(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.sub || req.user?.userId || 'default-user';
    return this.operationsService.getInterventions({ tenantId, userId });
  }

  @Post('interventions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveIntervention(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { rationale?: string },
  ) {
    const teacherId = req.user?.sub || req.user?.userId || 'teacher';
    return this.interventionService.approve(id, teacherId, body?.rationale);
  }

  @Post('interventions/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectIntervention(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { rationale: string },
  ) {
    const teacherId = req.user?.sub || req.user?.userId || 'teacher';
    return this.interventionService.reject(id, teacherId, body?.rationale || 'Rejected by teacher');
  }

  @Post('interventions/:id/outcome')
  @UseGuards(JwtAuthGuard)
  async recordOutcome(
    @Param('id') id: string,
    @Body() body: { baselineMastery: number; postMastery: number; evidenceCount: number },
  ) {
    return this.evaluationService.evaluateOutcome({
      interventionId: id,
      baselineMastery: body.baselineMastery,
      postMastery: body.postMastery,
      evidenceCount: body.evidenceCount,
    });
  }

  @Get('priorities')
  @UseGuards(JwtAuthGuard)
  async getPriorities(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.operationsService.getCommandCenterKPIs(tenantId);
  }

  @Get('clusters')
  @UseGuards(JwtAuthGuard)
  async getClusters(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const interventions = await this.interventionService.getInterventions({ tenantId });
    return this.teacherPriorityService.clusterInterventions(interventions);
  }

  @Get('institutional-signals')
  @UseGuards(JwtAuthGuard)
  async getInstitutionalSignals(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.institutionalService.getInstitutionalSignals(tenantId);
  }

  @Get('policy-recommendations')
  @UseGuards(JwtAuthGuard)
  async getPolicyRecommendations(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.policyService.listRecommendations(tenantId);
  }

  @Get('health')
  async checkHealth() {
    return {
      status: 'HEALTHY',
      subsystem: 'learning-operations',
      timestamp: new Date().toISOString(),
    };
  }
}
