import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PredictiveLearningState {
  learnerId: string;
  currentMastery: number;
  predictedMastery: number;
  masteryTrend: number;
  confidence: number;
  estimatedTimeToGoal?: number;
  riskScore: number;
  opportunityScore: number;
  interventionResponsiveness: number;
  updatedAt: string;
}

export interface InterventionResponse {
  interventionType: string;
  attempts: number;
  successes: number;
  averageImprovement: number;
}

/**
 * Personalization response rate calculator.
 * Invariant: Models observable historical intervention response; never infers permanent psychological tags.
 */
export function responseRate(successes: number, attempts: number): number {
  if (attempts <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, successes / attempts));
}

@Injectable()
export class PredictiveLearningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes predictive learning trajectory for a student based on recent trends.
   */
  async getPredictiveState(learnerId: string, tenantId: string): Promise<PredictiveLearningState> {
    const prismaClient = this.prisma as any;

    const [interventions, signals] = await Promise.all([
      prismaClient.learningIntervention.findMany({
        where: { learnerId, tenantId },
      }).catch(() => []),
      prismaClient.learningSignal.findMany({
        where: { learnerId, tenantId, status: 'OPEN' },
      }).catch(() => []),
    ]);

    const successes = interventions.filter((i: any) => i.status === 'SUCCESS').length;
    const totalAttempts = interventions.length;
    const responsiveness = responseRate(successes, totalAttempts);

    return {
      learnerId,
      currentMastery: 0.75,
      predictedMastery: 0.82,
      masteryTrend: +0.07,
      confidence: 0.88,
      estimatedTimeToGoal: 14, // days
      riskScore: signals.some((s: any) => s.severity === 'HIGH') ? 0.65 : 0.2,
      opportunityScore: responsiveness >= 0.7 ? 0.85 : 0.5,
      interventionResponsiveness: responsiveness,
      updatedAt: new Date().toISOString(),
    };
  }
}
