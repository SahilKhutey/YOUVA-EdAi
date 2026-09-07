import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InterventionOrchestrationService } from './intervention-orchestration.service';
import { ModelDriftService } from './model-drift.service';
import { AICostService } from './ai-cost.service';
import { InterventionMetrics, ModelMetrics } from './governance.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller(['v1/governance', 'governance'])
export class AIGovernanceController {
  constructor(
    private readonly interventionService: InterventionOrchestrationService,
    private readonly driftService: ModelDriftService,
    private readonly costService: AICostService,
  ) {}

  @Post('interventions/evaluate')
  @UseGuards(JwtAuthGuard)
  evaluateIntervention(@Body() metrics: InterventionMetrics) {
    return this.interventionService.evaluateIntervention(metrics);
  }

  @Post('interventions/record')
  @UseGuards(JwtAuthGuard)
  recordIntervention(
    @Body()
    body: {
      learnerId: string;
      metrics: InterventionMetrics;
      tenantId?: string;
    },
  ) {
    return this.interventionService.recordLearnerIntervention(
      body.learnerId,
      body.metrics,
      body.tenantId,
    );
  }

  @Post('drift/check')
  @UseGuards(JwtAuthGuard)
  checkModelDrift(
    @Body()
    body: {
      baseline: ModelMetrics;
      current: ModelMetrics;
    },
  ) {
    return this.driftService.evaluateDrift(body.baseline, body.current);
  }

  @Post('usage/record')
  @UseGuards(JwtAuthGuard)
  recordUsage(
    @Body()
    body: {
      tenantId?: string;
      learnerId?: string;
      agentId?: string;
      modelVersionId?: string;
      inputTokens: number;
      outputTokens: number;
      latencyMs?: number;
    },
  ) {
    return this.costService.recordUsage(body);
  }

  @Get('budget/:tenantId')
  @UseGuards(JwtAuthGuard)
  checkBudget(
    @Param('tenantId') tenantId: string,
    @Query('monthlyBudgetUSD') monthlyBudgetUSD?: string,
  ) {
    const budgetLimit = monthlyBudgetUSD ? parseFloat(monthlyBudgetUSD) : 1000.0;
    return this.costService.checkBudgetState(tenantId, budgetLimit);
  }
}
