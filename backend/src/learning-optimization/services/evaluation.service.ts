import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvaluationPolicy } from '../policies/evaluation-policy';
import { OutcomeService } from './outcome.service';
import { PlanEvaluationReport } from '../domain/evaluation';
import { BaselineDefinition, SuccessCriteria } from '../domain/improvement-plan';

export interface EvaluationInputDto {
  planId: string;
  observedPrimaryValue: number;
  sampleSize: number;
  observedGuardrails?: Record<string, number>;
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outcomeService: OutcomeService,
  ) {}

  /**
   * Evaluates an improvement plan against its baseline and success criteria.
   */
  async evaluatePlan(
    dto: EvaluationInputDto,
    tenantId = 'default-tenant',
  ): Promise<PlanEvaluationReport> {
    const plan = await this.prisma.improvementPlan.findFirst({
      where: { id: dto.planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${dto.planId}' not found.`);
    }

    const baseline: BaselineDefinition = JSON.parse(plan.baseline);
    const criteria: SuccessCriteria = JSON.parse(plan.successCriteria);

    // Default baseline values for guardrails if not present
    const baselineMetrics: Record<string, number> = {
      [baseline.metric]: 0.55, // default baseline
      abandonment: 0.12,
      hint_consumption: 0.25,
    };

    const observedMetrics: Record<string, number> = {
      [criteria.primaryMetric]: dto.observedPrimaryValue,
      ...(dto.observedGuardrails || { abandonment: 0.11, hint_consumption: 0.26 }),
    };

    const baselinePrimary = baselineMetrics[criteria.primaryMetric] ?? 0.55;

    // Evaluate guardrails
    const guardrailResults = EvaluationPolicy.evaluateGuardrails(
      criteria.guardrailMetrics,
      observedMetrics,
      baselineMetrics,
    );

    const allGuardrailsPassed = guardrailResults.every((g) => g.passed);

    // Classify outcome
    const classification = EvaluationPolicy.classifyOutcome(
      criteria,
      baselinePrimary,
      dto.observedPrimaryValue,
      dto.sampleSize,
      guardrailResults,
    );

    const delta = dto.observedPrimaryValue - baselinePrimary;
    const canStandardize = classification === 'POSITIVE_SIGNAL' && allGuardrailsPassed;
    const requiresReopen = classification === 'NEGATIVE_SIGNAL' || !allGuardrailsPassed;

    // Record outcome
    await this.outcomeService.recordOutcome(
      plan.id,
      criteria.primaryMetric,
      baselinePrimary,
      dto.observedPrimaryValue,
      dto.sampleSize,
      classification === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'MEASURED',
      classification,
      new Date(Date.now() - criteria.evaluationWindowDays * 86400000),
      new Date(),
      tenantId,
    );

    // Update plan status based on evaluation
    if (canStandardize) {
      await this.prisma.improvementPlan.update({
        where: { id: plan.id },
        data: { status: 'COMPLETED' },
      });
    } else if (requiresReopen && classification !== 'INSUFFICIENT_DATA') {
      await this.prisma.improvementPlan.update({
        where: { id: plan.id },
        data: { status: 'FAILED' },
      });
    } else {
      await this.prisma.improvementPlan.update({
        where: { id: plan.id },
        data: { status: 'EVALUATING' },
      });
    }

    return {
      planId: plan.id,
      tenantId,
      primaryMetric: criteria.primaryMetric,
      baselineValue: baselinePrimary,
      observedValue: dto.observedPrimaryValue,
      delta,
      sampleSize: dto.sampleSize,
      classification,
      guardrailResults,
      allGuardrailsPassed,
      canStandardize,
      requiresReopen,
      evaluatedAt: new Date(),
      summary: `Observed after change: Primary metric ${criteria.primaryMetric} ${
        delta >= 0 ? '+' : ''
      }${(delta * 100).toFixed(1)}% (N=${dto.sampleSize}). Guardrails: ${
        allGuardrailsPassed ? 'ALL PASSED' : 'SOME DEGRADED'
      }. Classification: ${classification}.`,
    };
  }
}
