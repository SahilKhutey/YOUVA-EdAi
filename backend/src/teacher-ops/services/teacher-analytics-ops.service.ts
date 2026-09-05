import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';

@Injectable()
export class TeacherAnalyticsOpsService {
  private readonly logger = new Logger(TeacherAnalyticsOpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  /**
   * Computes comprehensive teacher analytics strictly scoped to authorized students.
   * Handles empty cohorts safely with zero-safe defaults.
   */
  async getScopedAnalytics(teacherId: string) {
    const studentIds = await this.scopeAuth.getScopedStudentIds(teacherId);

    if (studentIds.length === 0) {
      return {
        cohortSize: 0,
        averageMastery: 0.0,
        averageAccuracy: 0.0,
        completionRate: 0.0,
        aiAgreementRate: 100.0,
        overrideRate: 0.0,
        totalRecommendations: 0,
        studentsNeedingAttention: 0,
        topicDistribution: [],
        aiAgreementMetrics: {
          proposed: 0,
          accepted: 0,
          overridden: 0,
          agreementPercentage: 100.0,
          overridePercentage: 0.0,
        },
      };
    }

    // 1. Evidence logs & accuracy
    const [evidenceLogs, masteries, decisions, pendingInterventions] = await Promise.all([
      this.prisma.learningEvidenceLog.findMany({
        where: { userId: { in: studentIds } },
        select: { accuracy: true, topicId: true, topic: { select: { title: true } } },
      }),
      this.prisma.userTopicMastery.findMany({
        where: { userId: { in: studentIds } },
        include: { topic: true },
      }),
      this.prisma.personalizationDecision.findMany({
        where: { userId: { in: studentIds } },
        select: { status: true },
      }),
      this.prisma.teacherIntervention.count({
        where: { studentId: { in: studentIds }, status: 'PENDING' },
      }),
    ]);

    // 2. Average Accuracy
    const avgAccuracy =
      evidenceLogs.length > 0
        ? evidenceLogs.reduce((sum, e) => sum + e.accuracy, 0) / evidenceLogs.length
        : 0.0;

    // 3. Average Mastery
    const avgMastery =
      masteries.length > 0
        ? masteries.reduce((sum, m) => sum + m.masteryProbability, 0) / masteries.length
        : 0.0;

    // 4. AI-Teacher Agreement Metrics
    const totalDecisions = decisions.length;
    const acceptedDecisions = decisions.filter((d) => d.status === 'ACCEPTED').length;
    const overriddenDecisions = decisions.filter((d) => d.status === 'OVERRIDDEN').length;

    const agreementRate =
      totalDecisions > 0
        ? ((totalDecisions - overriddenDecisions) / totalDecisions) * 100
        : 100.0;
    const overrideRate = totalDecisions > 0 ? (overriddenDecisions / totalDecisions) * 100 : 0.0;

    // 5. Topic Mastery Distribution
    const topicMap = new Map<string, { total: number; count: number }>();
    masteries.forEach((m) => {
      const title = m.topic?.title || 'Unknown Topic';
      const existing = topicMap.get(title) || { total: 0, count: 0 };
      topicMap.set(title, {
        total: existing.total + m.masteryProbability,
        count: existing.count + 1,
      });
    });

    const topicDistribution = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      avgMastery: parseFloat((stats.total / stats.count).toFixed(2)),
      studentCount: stats.count,
    }));

    return {
      cohortSize: studentIds.length,
      averageMastery: parseFloat(avgMastery.toFixed(2)),
      averageAccuracy: parseFloat((avgAccuracy * 100).toFixed(1)),
      studentsNeedingAttention: pendingInterventions,
      totalRecommendations: totalDecisions,
      aiAgreementRate: parseFloat(agreementRate.toFixed(1)),
      overrideRate: parseFloat(overrideRate.toFixed(1)),
      aiAgreementMetrics: {
        proposed: totalDecisions,
        accepted: acceptedDecisions,
        overridden: overriddenDecisions,
        agreementPercentage: parseFloat(agreementRate.toFixed(1)),
        overridePercentage: parseFloat(overrideRate.toFixed(1)),
      },
      topicDistribution,
    };
  }
}
