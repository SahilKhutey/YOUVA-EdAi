import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RiskScoreInput,
  calculateRisk,
  riskLevel,
} from './risk.types';

@Injectable()
export class RiskDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes operational learning risk for a learner from active signals.
   * Invariant: Risk is strictly an operational triage signal, NEVER clinical diagnosis.
   */
  async evaluateLearnerRisk(learnerId: string, tenantId: string) {
    const prismaClient = this.prisma as any;
    const signals = await prismaClient.learningSignal.findMany({
      where: {
        learnerId,
        tenantId,
        status: 'OPEN',
      },
    });

    let masteryRisk = 0;
    let misconceptionRisk = 0;
    let assessmentRisk = 0;
    let goalDrift = 0;
    let engagementRisk = 0;

    for (const sig of signals) {
      if (sig.type === 'MASTERY_DECLINE') masteryRisk = Math.max(masteryRisk, sig.score);
      if (sig.type === 'REPEATED_MISCONCEPTION') misconceptionRisk = Math.max(misconceptionRisk, sig.score);
      if (sig.type === 'ASSESSMENT_RISK') assessmentRisk = Math.max(assessmentRisk, sig.score);
      if (sig.type === 'GOAL_DRIFT') goalDrift = Math.max(goalDrift, sig.score);
      if (sig.type === 'ENGAGEMENT_DECLINE') engagementRisk = Math.max(engagementRisk, sig.score);
    }

    const input: RiskScoreInput = {
      masteryRisk,
      misconceptionRisk,
      assessmentRisk,
      goalDrift,
      engagementRisk,
      evidenceConfidence: signals.length > 0 ? 0.85 : 1.0,
    };

    const score = calculateRisk(input);
    const level = riskLevel(score);

    return {
      learnerId,
      tenantId,
      score,
      level,
      activeSignalsCount: signals.length,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
