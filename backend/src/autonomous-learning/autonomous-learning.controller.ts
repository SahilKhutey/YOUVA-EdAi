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
import { AutonomousActionService } from './actions/action.service';
import { NextBestActionService, ActionCandidate } from './optimization/next-best-action.service';
import { LearningPolicyService } from './policy/learning-policy.service';
import { PredictiveLearningService } from './prediction/predictive-state.service';
import { LearningSimulationService } from './simulation/learning-simulation.service';
import { AgentService, AgentRequest } from './agents/agent.service';
import { HumanApprovalService } from './approval/human-approval.service';
import { DecisionProvenanceService } from './provenance/decision-provenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller(['api/v1/autonomous-learning', 'v1/autonomous-learning', 'autonomous-learning'])
export class AutonomousLearningController {
  constructor(
    private readonly actionService: AutonomousActionService,
    private readonly nextBestActionService: NextBestActionService,
    private readonly policyService: LearningPolicyService,
    private readonly predictionService: PredictiveLearningService,
    private readonly simulationService: LearningSimulationService,
    private readonly agentService: AgentService,
    private readonly approvalService: HumanApprovalService,
    private readonly provenanceService: DecisionProvenanceService,
  ) {}

  @Get('actions')
  @UseGuards(JwtAuthGuard)
  async getActions(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.actionService.getActions(tenantId);
  }

  @Post('actions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveAction(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.sub || req.user?.userId || 'user';
    return this.actionService.approve(id, { tenantId, userId });
  }

  @Post('actions/:id/execute')
  @UseGuards(JwtAuthGuard)
  async executeAction(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Student role is strictly forbidden from triggering direct action execution (Section 47)
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot directly execute autonomous actions.');
    }
    return this.actionService.execute(id);
  }

  @Post('actions/:id/rollback')
  @UseGuards(JwtAuthGuard)
  async rollbackAction(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot rollback actions.');
    }
    return this.actionService.rollback(id, body?.reason || 'Teacher requested rollback');
  }

  @Get('predictions')
  @UseGuards(JwtAuthGuard)
  async getPredictions(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    const learnerId = req.user?.sub || req.user?.userId || 'default-learner';
    return this.predictionService.getPredictiveState(learnerId, tenantId);
  }

  @Post('simulations')
  @UseGuards(JwtAuthGuard)
  async runSimulation(
    @Req() req: AuthenticatedRequest,
    @Body() body: { actionType: string; parameters?: Record<string, any> },
  ) {
    const learnerId = req.user?.sub || req.user?.userId || 'learner';
    return this.simulationService.simulateAction(learnerId, body.actionType, body.parameters);
  }

  @Post('agents')
  @UseGuards(JwtAuthGuard)
  async dispatchAgent(
    @Req() req: AuthenticatedRequest,
    @Body() request: AgentRequest,
  ) {
    if (req.user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot trigger autonomous agents.');
    }
    return this.agentService.executeAgentTask(request);
  }

  @Get('approvals')
  @UseGuards(JwtAuthGuard)
  async getApprovals(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || 'default-tenant';
    return this.approvalService.getPendingApprovals(tenantId);
  }

  @Post('policies/evaluate')
  @UseGuards(JwtAuthGuard)
  async evaluatePolicy(
    @Body() input: {
      actionType: string;
      ageTier: string;
      confidence: number;
      reversible: boolean;
      requiresHumanApproval: boolean;
    },
  ) {
    return this.policyService.decide(input);
  }

  @Get('provenance/:actionId')
  @UseGuards(JwtAuthGuard)
  async getExplanation(@Param('actionId') actionId: string) {
    return this.provenanceService.explainDecision(actionId);
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'HEALTHY',
      subsystem: 'autonomous-learning-os',
      autonomyLevel: 'GOVERNED_BOUNDED',
      timestamp: new Date().toISOString(),
    };
  }
}
