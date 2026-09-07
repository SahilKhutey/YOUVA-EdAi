import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InterventionOutcome,
  calculateOutcome,
  RecommendationOutcome,
  recommendationQuality,
} from './evaluation.types';

@Injectable()
export class InterventionEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates the outcome of an intervention by calculating the delta between baseline and post-intervention mastery.
   */
  async evaluateOutcome(data: {
    interventionId: string;
    baselineMastery: number;
    postMastery: number;
    evidenceCount: number;
    methodology?: string;
  }): Promise<InterventionOutcome> {
    const outcomeStatus = calculateOutcome(data.baselineMastery, data.postMastery);
    const effectSize = data.postMastery - data.baselineMastery;
    const prismaClient = this.prisma as any;

    await prismaClient.interventionEvaluation.create({
      data: {
        interventionId: data.interventionId,
        baselineValue: data.baselineMastery,
        outcomeValue: data.postMastery,
        effectSize,
        confidence: 0.9,
        methodology: data.methodology ?? 'PRE_POST_DIFFERENCE',
        evaluatorType: 'AUTOMATED_DIAGNOSTIC',
        notes: `Outcome status: ${outcomeStatus}`,
      },
    });

    await prismaClient.learningIntervention.update({
      where: { id: data.interventionId },
      data: {
        status: outcomeStatus,
        completedAt: new Date(),
        outcomeJson: JSON.stringify({
          baseline: data.baselineMastery,
          post: data.postMastery,
          status: outcomeStatus,
        }),
      },
    }).catch(() => null);

    return {
      interventionId: data.interventionId,
      baseline: { mastery: data.baselineMastery, confidence: 0.9 },
      postIntervention: { mastery: data.postMastery, confidence: 0.9 },
      evidenceCount: data.evidenceCount,
      status: outcomeStatus,
    };
  }

  /**
   * Scores AI recommendation quality for offline model auditing.
   */
  evaluateRecommendationQuality(outcome: RecommendationOutcome): number {
    return recommendationQuality(outcome);
  }
}
