import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaselineDefinition } from '../domain/improvement-plan';
import { OutcomeClassification, OutcomeStatus } from '../domain/outcome';

@Injectable()
export class OutcomeService {
  private readonly logger = new Logger(OutcomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes or records observed outcome metrics for an improvement plan.
   */
  async recordOutcome(
    planId: string,
    metric: string,
    baselineValue: number,
    observedValue: number,
    sampleSize: number,
    status: OutcomeStatus,
    classification?: OutcomeClassification,
    windowStart?: Date,
    windowEnd?: Date,
    tenantId = 'default-tenant',
  ) {
    const delta = observedValue - baselineValue;
    const now = new Date();

    return this.prisma.improvementOutcome.create({
      data: {
        tenantId,
        planId,
        metric,
        baselineValue,
        observedValue,
        delta,
        sampleSize,
        confidence: sampleSize >= 15 ? 0.9 : 0.7,
        status,
        classification,
        windowStart: windowStart || new Date(now.getTime() - 14 * 86400000),
        windowEnd: windowEnd || now,
      },
    });
  }

  /**
   * Fetches all recorded outcomes for a plan.
   */
  async getOutcomesForPlan(planId: string, tenantId = 'default-tenant') {
    return this.prisma.improvementOutcome.findMany({
      where: { planId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
