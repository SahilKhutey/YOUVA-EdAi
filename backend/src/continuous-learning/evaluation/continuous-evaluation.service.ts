import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvaluationDelta,
  EvaluationMetric,
  EvolutionEvaluationDto,
  SuccessCriterion,
} from '../domain/evolution.types';

@Injectable()
export class ContinuousEvaluationService {
  private readonly logger = new Logger(ContinuousEvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEvaluation(dto: {
    tenantId?: string;
    interventionId: string;
    baseline: EvaluationMetric[];
    actual: EvaluationMetric[];
    successCriteria: SuccessCriterion[];
    methodologyVersion?: string;
    evidenceIds?: string[];
    limitations?: string[];
    concurrentInterventions?: string[];
  }): Promise<EvolutionEvaluationDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const methodologyVersion = dto.methodologyVersion ?? '1.0.0';
    const evidenceIds = dto.evidenceIds ?? [];
    const limitations: string[] = dto.limitations ? [...dto.limitations] : [];

    // 1. Calculate Deltas
    const deltas: EvaluationDelta[] = [];
    for (const act of dto.actual) {
      const base = dto.baseline.find((b) => b.name === act.name);
      const baseVal = base ? base.value : 0;
      const diff = act.value - baseVal;
      const pct = baseVal !== 0 ? (diff / baseVal) * 100 : 0;
      deltas.push({
        metric: act.name,
        baseline: baseVal,
        actual: act.value,
        delta: Number(diff.toFixed(2)),
        pctChange: Number(pct.toFixed(2)),
      });
    }

    // 2. Evaluate Success Criteria
    const evaluatedCriteria: SuccessCriterion[] = dto.successCriteria.map((crit) => {
      const delta = deltas.find((d) => d.metric === crit.metric);
      let satisfied = false;
      if (delta) {
        if (crit.comparator === 'GREATER_THAN') {
          satisfied = delta.delta > crit.targetDelta;
        } else if (crit.comparator === 'LESS_THAN') {
          satisfied = delta.delta < crit.targetDelta;
        } else {
          satisfied = Math.abs(delta.delta - crit.targetDelta) < 0.01;
        }
      }
      return { ...crit, satisfied };
    });

    // 3. Enforce "Never Overclaim Causality" Invariant
    if (dto.concurrentInterventions && dto.concurrentInterventions.length > 1) {
      const causalityLimitation = `Non-Causal Attribution Notice: Outcome changed following intervention package (${dto.concurrentInterventions.join(', ')}). Multiple concurrent interventions occurred; specific single-factor causality is not established.`;
      limitations.push(causalityLimitation);
      this.logger.log(`Evaluation for intervention '${dto.interventionId}' noted concurrent interventions: ${causalityLimitation}`);
    }

    // 4. Determine Status
    const allSatisfied = evaluatedCriteria.every((c) => c.satisfied);
    const anyEvaluated = evaluatedCriteria.length > 0;
    const status = anyEvaluated ? (allSatisfied ? 'COMPLETED' : 'INCONCLUSIVE') : 'COMPLETED';

    const record = await this.prisma.evolutionEvaluation.create({
      data: {
        tenantId,
        interventionId: dto.interventionId,
        baseline: dto.baseline as any,
        actual: dto.actual as any,
        deltas: deltas as any,
        successCriteria: evaluatedCriteria as any,
        methodologyVersion,
        evidenceIds: evidenceIds as any,
        limitations: limitations as any,
        status,
      },
    });

    this.logger.log(`Created evolution evaluation '${record.id}' for intervention '${dto.interventionId}' with status '${status}'.`);

    return this.mapToDto(record);
  }

  async getEvaluation(id: string): Promise<EvolutionEvaluationDto> {
    const record = await this.prisma.evolutionEvaluation.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Evolution evaluation '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listEvaluations(tenantId = 'default-tenant'): Promise<EvolutionEvaluationDto[]> {
    const records = await this.prisma.evolutionEvaluation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): EvolutionEvaluationDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      interventionId: r.interventionId,
      baseline: r.baseline as any,
      actual: r.actual as any,
      deltas: r.deltas as any,
      successCriteria: r.successCriteria as any,
      methodologyVersion: r.methodologyVersion,
      evidenceIds: r.evidenceIds as any,
      limitations: r.limitations as any,
      status: r.status as any,
      createdAt: r.createdAt,
    };
  }
}
