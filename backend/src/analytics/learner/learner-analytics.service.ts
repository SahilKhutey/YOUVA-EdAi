import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrendPoint {
  date: string;
  value: number;
}

export interface LearningActivitySummary {
  totalSessions: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  totalHintsRequested: number;
}

export interface LearnerAnalyticsOverview {
  learnerId: string;
  activeKnowledgeCount: number;
  masteredKnowledgeCount: number;
  developingKnowledgeCount: number;
  reviewDueCount: number;
  remediationCount: number;
  objectiveProgress: number; // 0.0 - 1.0
  activitySummary: LearningActivitySummary;
  evidenceTrend: TrendPoint[];
  calculationVersion: string;
}

@Injectable()
export class LearnerAnalyticsService {
  private readonly logger = new Logger(LearnerAnalyticsService.name);
  private readonly CALCULATION_VERSION = 'mastery-rate-v1';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Derives comprehensive learner analytics while explicitly distinguishing
   * Activity != Evidence != Mastery != Outcome.
   */
  async getLearnerOverview(
    learnerId: string,
    tenantId: string = 'default-tenant',
  ): Promise<LearnerAnalyticsOverview> {
    const now = new Date();

    // 1. Fetch learner knowledge states
    const states = await this.prisma.learnerKnowledgeState.findMany({
      where: { learnerId, tenantId },
      include: { knowledgeObject: { select: { title: true, type: true } } },
    });

    const activeKnowledgeCount = states.filter((s) => s.attempts > 0).length;
    const masteredKnowledgeCount = states.filter((s) => s.masteryLevel >= 0.8).length;
    const developingKnowledgeCount = states.filter(
      (s) => s.masteryLevel >= 0.4 && s.masteryLevel < 0.8,
    ).length;
    const reviewDueCount = states.filter(
      (s) => s.nextReviewAt && s.nextReviewAt <= now,
    ).length;
    const remediationCount = states.filter(
      (s) => s.status === 'STRUGGLING' || s.struggleScore >= 0.5,
    ).length;

    const totalMastery = states.reduce((sum, s) => sum + s.masteryLevel, 0);
    const objectiveProgress =
      states.length > 0 ? Number((totalMastery / states.length).toFixed(2)) : 0;

    // 2. Fetch learning evidence logs for activity & evidence trend
    const evidenceLogs = await this.prisma.learningEvidenceLog.findMany({
      where: { userId: learnerId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalAttempts = evidenceLogs.length;
    const correctAttempts = evidenceLogs.filter((e) => e.accuracy >= 0.7).length;
    const accuracyRate =
      totalAttempts > 0 ? Number((correctAttempts / totalAttempts).toFixed(2)) : 0;
    const totalHintsRequested = evidenceLogs.reduce((sum, e) => sum + e.hintCount, 0);

    // Fetch learning sessions count
    const sessionCount = await this.prisma.knowledgeLearningSession.count({
      where: { learnerId, tenantId },
    });

    // 3. Compute 7-day evidence accuracy trend
    const evidenceTrend = this.computeEvidenceTrend(evidenceLogs);

    return {
      learnerId,
      activeKnowledgeCount,
      masteredKnowledgeCount,
      developingKnowledgeCount,
      reviewDueCount,
      remediationCount,
      objectiveProgress,
      activitySummary: {
        totalSessions: sessionCount,
        totalAttempts,
        correctAttempts,
        accuracyRate,
        totalHintsRequested,
      },
      evidenceTrend,
      calculationVersion: this.CALCULATION_VERSION,
    };
  }

  /**
   * Detailed concept-by-concept mastery breakdown.
   */
  async getLearnerMastery(learnerId: string, tenantId: string = 'default-tenant') {
    const states = await this.prisma.learnerKnowledgeState.findMany({
      where: { learnerId, tenantId },
      include: { knowledgeObject: { select: { title: true, type: true, slug: true } } },
      orderBy: { masteryLevel: 'desc' },
    });

    return states.map((s: any) => ({
      knowledgeId: s.knowledgeObjectId,
      title: s.knowledgeObject?.title || 'Concept',
      type: s.knowledgeObject?.type || 'LESSON',
      masteryLevel: s.masteryLevel,
      confidence: s.confidence,
      status: s.status,
      attempts: s.attempts,
      correctAttempts: s.correctAttempts,
      nextReviewAt: s.nextReviewAt,
    }));
  }

  private computeEvidenceTrend(logs: any[]): TrendPoint[] {
    const dailyMap = new Map<string, { totalAcc: number; count: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, { totalAcc: 0, count: 0 });
    }

    for (const log of logs) {
      const dateStr = new Date(log.createdAt).toISOString().split('T')[0];
      if (dailyMap.has(dateStr)) {
        const item = dailyMap.get(dateStr)!;
        item.totalAcc += log.accuracy;
        item.count++;
      }
    }

    return Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      value: val.count > 0 ? Number((val.totalAcc / val.count).toFixed(2)) : 0,
    }));
  }
}
