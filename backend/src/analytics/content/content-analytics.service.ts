import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ContentQualitySignal =
  | 'HIGH_SUPPORT_DEMAND'
  | 'HIGH_ERROR_RATE'
  | 'LOW_COMPLETION'
  | 'STRONG_PERFORMANCE';

export interface ContentAnalyticsOverview {
  knowledgeId: string;
  title: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  totalAttempts: number;
  averageAccuracy: number;
  totalHintsRequested: number;
  hintsPerSession: number;
  qualitySignals: ContentQualitySignal[];
  versionBreakdown: Array<{
    version: number;
    sessions: number;
    completions: number;
    completionRate: number;
  }>;
}

@Injectable()
export class ContentAnalyticsService {
  private readonly logger = new Logger(ContentAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Derives content consumption analytics, version lineage, and diagnostic quality signals.
   */
  async getContentAnalytics(
    knowledgeId: string,
    tenantId: string = 'default-tenant',
  ): Promise<ContentAnalyticsOverview> {
    const knowledgeObj = await this.prisma.knowledgeObject.findFirst({
      where: {
        id: knowledgeId,
        OR: [{ tenantId }, { tenantId: null }],
      },
      include: { versions: { orderBy: { version: 'asc' } } },
    });

    const title = knowledgeObj?.title || 'Knowledge Object';

    // 1. Fetch sessions
    const sessions = await this.prisma.knowledgeLearningSession.findMany({
      where: { knowledgeObjectId: knowledgeId, tenantId },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completedAt !== null).length;
    const completionRate =
      totalSessions > 0 ? Number((completedSessions / totalSessions).toFixed(2)) : 0;

    // 2. Fetch evidence logs for this knowledge object
    const evidenceLogs = await this.prisma.learningEvidenceLog.findMany({
      where: { knowledgeObjectId: knowledgeId, tenantId },
    });

    const totalAttempts = evidenceLogs.length;
    const totalAccuracy = evidenceLogs.reduce((sum, e) => sum + e.accuracy, 0);
    const averageAccuracy =
      totalAttempts > 0 ? Number((totalAccuracy / totalAttempts).toFixed(2)) : 0;
    const totalHintsRequested = evidenceLogs.reduce((sum, e) => sum + e.hintCount, 0);
    const hintsPerSession =
      totalSessions > 0 ? Number((totalHintsRequested / totalSessions).toFixed(2)) : 0;

    // 3. Derive diagnostic quality signals
    const qualitySignals: ContentQualitySignal[] = [];
    if (hintsPerSession > 2.5) qualitySignals.push('HIGH_SUPPORT_DEMAND');
    if (totalAttempts > 10 && averageAccuracy < 0.5) qualitySignals.push('HIGH_ERROR_RATE');
    if (totalSessions >= 5 && completionRate < 0.4) qualitySignals.push('LOW_COMPLETION');
    if (totalSessions >= 5 && completionRate >= 0.85 && averageAccuracy >= 0.8) {
      qualitySignals.push('STRONG_PERFORMANCE');
    }

    // 4. Version breakdown
    const versionMap = new Map<number, { sessions: number; completions: number }>();
    if (knowledgeObj?.versions) {
      for (const v of knowledgeObj.versions) {
        versionMap.set(v.version, { sessions: 0, completions: 0 });
      }
    }

    for (const s of sessions) {
      const vNum = s.knowledgeVersionId ? 1 : 1; // Default or mapped version
      if (!versionMap.has(vNum)) {
        versionMap.set(vNum, { sessions: 0, completions: 0 });
      }
      const item = versionMap.get(vNum)!;
      item.sessions++;
      if (s.completedAt) item.completions++;
    }

    const versionBreakdown = Array.from(versionMap.entries()).map(([version, data]) => ({
      version,
      sessions: data.sessions,
      completions: data.completions,
      completionRate:
        data.sessions > 0 ? Number((data.completions / data.sessions).toFixed(2)) : 0,
    }));

    return {
      knowledgeId,
      title,
      totalSessions,
      completedSessions,
      completionRate,
      totalAttempts,
      averageAccuracy,
      totalHintsRequested,
      hintsPerSession,
      qualitySignals,
      versionBreakdown,
    };
  }
}
