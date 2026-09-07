import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Benchmark,
  OutcomeInput,
  RecordOutcomeDto,
} from './outcome.types';

/**
 * Calculates a multidimensional learning outcome score (mastery gain, retention, transfer, independence).
 */
export function calculateOutcome(input: OutcomeInput): number {
  const masteryGain = Math.max(0, input.finalMastery - input.baselineMastery);
  const retention = input.retentionScore ?? 0;
  const transfer = input.transferScore ?? 0;
  const independence = input.independence ?? 0;

  return (
    masteryGain * 0.50 +
    retention * 0.20 +
    transfer * 0.20 +
    independence * 0.10
  );
}

/**
 * Privacy-preserving benchmark rule: Enforces minimum cohort size before publishing aggregate stats.
 */
export function canPublishBenchmark(
  populationSize: number,
  minimumGroupSize: number,
): boolean {
  return populationSize >= minimumGroupSize;
}

@Injectable()
export class OutcomeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a validated learning outcome in the database.
   */
  async recordOutcome(dto: RecordOutcomeDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningOutcome.create({
      data: {
        tenantId: dto.tenantId,
        learnerId: dto.learnerId,
        conceptId: dto.conceptId,
        interventionId: dto.interventionId,
        experimentId: dto.experimentId,
        baselineMastery: dto.baselineMastery,
        finalMastery: dto.finalMastery,
        retentionScore: dto.retentionScore,
        transferScore: dto.transferScore,
        independence: dto.independence,
      },
    });
  }

  /**
   * Retrieves outcomes for an individual learner.
   */
  async getLearnerOutcomes(learnerId: string, tenantId?: string) {
    const prismaClient = this.prisma as any;
    const where: any = { learnerId };
    if (tenantId) where.tenantId = tenantId;

    return prismaClient.learningOutcome.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Retrieves aggregated outcomes for a pedagogical concept.
   */
  async getConceptOutcomes(conceptId: string, tenantId?: string) {
    const prismaClient = this.prisma as any;
    const where: any = { conceptId };
    if (tenantId) where.tenantId = tenantId;

    return prismaClient.learningOutcome.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Computes privacy-preserved cohort benchmarks without revealing individual student identities.
   */
  async getCohortBenchmark(
    tenantId: string,
    metric = 'masteryGain',
    minimumGroupSize = 20,
  ): Promise<{ published: boolean; benchmark?: Benchmark; reason?: string }> {
    const prismaClient = this.prisma as any;
    const outcomes = await prismaClient.learningOutcome.findMany({
      where: { tenantId },
      select: {
        baselineMastery: true,
        finalMastery: true,
      },
    });

    const populationSize = outcomes.length;
    if (!canPublishBenchmark(populationSize, minimumGroupSize)) {
      return {
        published: false,
        reason: `Population size ${populationSize} is below the privacy-preserving minimum threshold (${minimumGroupSize}).`,
      };
    }

    const gains = outcomes
      .map((o: any) => Math.max(0, o.finalMastery - o.baselineMastery))
      .sort((a: number, b: number) => a - b);

    const sum = gains.reduce((acc: number, val: number) => acc + val, 0);
    const mean = Number((sum / populationSize).toFixed(4));
    const median = gains[Math.floor(populationSize / 2)];
    const percentile25 = gains[Math.floor(populationSize * 0.25)];
    const percentile75 = gains[Math.floor(populationSize * 0.75)];

    return {
      published: true,
      benchmark: {
        metric,
        populationSize,
        mean,
        median,
        percentile25,
        percentile75,
        confidenceInterval: {
          lower: Math.max(0, mean - 0.05),
          upper: Math.min(1.0, mean + 0.05),
        },
      },
    };
  }
}
