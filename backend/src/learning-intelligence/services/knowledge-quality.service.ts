import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KnowledgeQualityProfile } from '../domain/intelligence.types';

@Injectable()
export class KnowledgeQualityService {
  private readonly logger = new Logger(KnowledgeQualityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates an explainable 4-dimensional KnowledgeQualityProfile for a knowledge object.
   */
  async getQualityProfile(
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<KnowledgeQualityProfile> {
    const knowledge = await this.prisma.knowledgeObject.findUnique({
      where: { id: knowledgeId },
      include: {
        evidenceLogs: { take: 200, orderBy: { createdAt: 'desc' } },
        learningSessions: { take: 200 },
        learnerStates: true,
      },
    });

    if (!knowledge) {
      throw new NotFoundException(`Knowledge object '${knowledgeId}' not found`);
    }

    const sessions = knowledge.learningSessions;
    const evidence = knowledge.evidenceLogs;
    const states = knowledge.learnerStates;

    // 1. Engagement Dimension
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const abandonedSessions = sessions.filter((s) => s.status === 'ABANDONED').length;

    const completionRate = totalSessions > 0 ? Number((completedSessions / totalSessions).toFixed(2)) : 0;
    const abandonmentRate = totalSessions > 0 ? Number((abandonedSessions / totalSessions).toFixed(2)) : 0;
    const returnRate = totalSessions > 0 ? Number((1 - abandonmentRate).toFixed(2)) : 0;

    // 2. Learning Dimension
    const totalStates = states.length;
    const masteredStates = states.filter((s) => s.status === 'MASTERED' || s.masteryLevel >= 0.8).length;
    const developingStates = states.filter((s) => s.masteryLevel >= 0.5).length;

    const masteryProgressionRate = totalStates > 0 ? Number((masteredStates / totalStates).toFixed(2)) : 0;
    const objectiveCompletionRate = totalStates > 0 ? Number((developingStates / totalStates).toFixed(2)) : 0;

    const totalEvidence = evidence.length;
    const correctEvidence = evidence.filter((e) => e.accuracy >= 0.7).length;
    const assessmentSuccessRate = totalEvidence > 0 ? Number((correctEvidence / totalEvidence).toFixed(2)) : 0;

    // 3. Support Dimension
    const totalHints = evidence.reduce((sum, e) => sum + e.hintCount, 0);
    const hintRate = totalEvidence > 0 ? Number((totalHints / totalEvidence).toFixed(2)) : 0;
    const explanationRate = Number((hintRate * 0.4).toFixed(2));
    const remediationCount = states.filter((s) => s.status === 'STRUGGLING').length;
    const remediationRate = totalStates > 0 ? Number((remediationCount / totalStates).toFixed(2)) : 0;

    // 4. Difficulty Dimension
    const struggleCount = states.filter((s) => s.struggleScore > 0.5 || s.status === 'STRUGGLING').length;
    const struggleRate = totalStates > 0 ? Number((struggleCount / totalStates).toFixed(2)) : 0;
    const repeatedErrors = evidence.filter((e) => e.attemptNumber > 2).length;
    const repeatedErrorRate = totalEvidence > 0 ? Number((repeatedErrors / totalEvidence).toFixed(2)) : 0;

    // Diagnostic Flags (Explainable criteria)
    const flags: string[] = [];
    if (abandonmentRate >= 0.35) flags.push('ELEVATED_ABANDONMENT');
    if (hintRate >= 1.5) flags.push('HIGH_SUPPORT_DEMAND');
    if (repeatedErrorRate >= 0.3) flags.push('REPEATED_CONCEPTUAL_ERRORS');
    if (struggleRate >= 0.4) flags.push('HIGH_STRUGGLE_RATE');
    if (masteryProgressionRate >= 0.75 && assessmentSuccessRate >= 0.8) flags.push('STRONG_PEDAGOGICAL_PERFORMANCE');

    const sampleSize = totalEvidence + totalSessions;
    const confidence = Math.min(0.98, Math.max(0.6, Number((0.6 + (sampleSize / 100) * 0.35).toFixed(2))));

    return {
      knowledgeId,
      title: knowledge.title,
      engagement: {
        completionRate,
        returnRate,
        abandonmentRate,
      },
      learning: {
        objectiveCompletionRate,
        masteryProgressionRate,
        assessmentSuccessRate,
      },
      support: {
        hintRate,
        explanationRate,
        remediationRate,
      },
      difficulty: {
        struggleRate,
        repeatedErrorRate,
      },
      confidence,
      sampleSize,
      flags,
      calculatedAt: new Date(),
    };
  }
}
