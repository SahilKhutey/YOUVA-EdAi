import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OpportunityScoreInput,
  calculateOpportunity,
  OpportunityType,
} from './opportunity.types';

@Injectable()
export class OpportunityDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates opportunities for advancement, acceleration, and enrichment.
   */
  async detectOpportunities(learnerId: string, tenantId: string) {
    const prismaClient = this.prisma as any;
    const signals = await prismaClient.learningSignal.findMany({
      where: {
        learnerId,
        tenantId,
        type: { in: ['MASTERY_BREAKTHROUGH', 'HIGH_CONFIDENCE', 'INTERVENTION_SUCCESS'] },
        status: 'OPEN',
      },
    });

    const input: OpportunityScoreInput = {
      mastery: signals.length > 0 ? 0.9 : 0.7,
      confidence: 0.95,
      consistency: 0.85,
      goalAlignment: 0.9,
      prerequisiteCompletion: 1.0,
    };

    const score = calculateOpportunity(input);
    const opportunities: Array<{ type: OpportunityType; score: number; rationale: string }> = [];

    if (score >= 0.8) {
      opportunities.push({
        type: 'ADVANCEMENT',
        score,
        rationale: 'High sustained mastery and consistency indicate readiness for accelerated challenges.',
      });
    }

    return {
      learnerId,
      tenantId,
      score,
      opportunities,
      detectedAt: new Date().toISOString(),
    };
  }
}
