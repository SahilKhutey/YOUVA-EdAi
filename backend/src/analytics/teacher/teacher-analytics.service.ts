import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ClassAnalyticsOverview {
  classId: string;
  totalStudents: number;
  objectiveProgress: number;
  masteryDistribution: {
    mastered: number;
    developing: number;
    struggling: number;
  };
  reviewDueCount: number;
  remediationCount: number;
  teacherInterventionCount: number;
  topLearningSignals: Array<{
    knowledgeId: string;
    title: string;
    strugglingStudents: number;
    averageMastery: number;
  }>;
}

@Injectable()
export class TeacherAnalyticsService {
  private readonly logger = new Logger(TeacherAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Derives class-level aggregated analytics and struggle signals.
   */
  async getClassOverview(
    classId: string,
    teacherId: string,
    tenantId: string = 'default-tenant',
  ): Promise<ClassAnalyticsOverview> {
    // 1. Fetch enrolled students in class
    const enrollments = await this.prisma.teacherClassEnrollment.findMany({
      where: { classId },
      select: { studentId: true },
    });

    const studentIds = enrollments.map((e) => e.studentId);
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return {
        classId,
        totalStudents: 0,
        objectiveProgress: 0,
        masteryDistribution: { mastered: 0, developing: 0, struggling: 0 },
        reviewDueCount: 0,
        remediationCount: 0,
        teacherInterventionCount: 0,
        topLearningSignals: [],
      };
    }

    // 2. Fetch learner states across enrolled students
    const states = await this.prisma.learnerKnowledgeState.findMany({
      where: {
        learnerId: { in: studentIds },
        tenantId,
      },
      include: { knowledgeObject: { select: { title: true } } },
    });

    // 3. Compute student-level average mastery
    const studentMasteryMap = new Map<string, number[]>();
    for (const id of studentIds) {
      studentMasteryMap.set(id, []);
    }

    const now = new Date();
    let reviewDueCount = 0;
    let remediationCount = 0;

    for (const state of states) {
      studentMasteryMap.get(state.learnerId)?.push(state.masteryLevel);
      if (state.nextReviewAt && state.nextReviewAt <= now) {
        reviewDueCount++;
      }
      if (state.status === 'STRUGGLING' || state.struggleScore >= 0.5) {
        remediationCount++;
      }
    }

    let mastered = 0;
    let developing = 0;
    let struggling = 0;
    let totalAvgMastery = 0;

    for (const [_, scores] of studentMasteryMap.entries()) {
      if (scores.length === 0) {
        developing++;
        continue;
      }
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      totalAvgMastery += avg;

      if (avg >= 0.8) mastered++;
      else if (avg >= 0.4) developing++;
      else struggling++;
    }

    const objectiveProgress =
      totalStudents > 0 ? Number((totalAvgMastery / totalStudents).toFixed(2)) : 0;

    // 4. Fetch teacher interventions pending/active for these students
    const teacherInterventionCount = await this.prisma.teacherIntervention.count({
      where: {
        studentId: { in: studentIds },
        status: 'PENDING',
      },
    });

    // 5. Compute top learning signals (concepts with lowest average mastery or highest struggle)
    const conceptStruggleMap = new Map<
      string,
      { title: string; scores: number[]; strugglingCount: number }
    >();

    for (const s of states) {
      if (!conceptStruggleMap.has(s.knowledgeObjectId)) {
        conceptStruggleMap.set(s.knowledgeObjectId, {
          title: (s as any).knowledgeObject?.title || 'Concept',
          scores: [],
          strugglingCount: 0,
        });
      }
      const c = conceptStruggleMap.get(s.knowledgeObjectId)!;
      c.scores.push(s.masteryLevel);
      if (s.masteryLevel < 0.5 || s.status === 'STRUGGLING') {
        c.strugglingCount++;
      }
    }

    const topLearningSignals = Array.from(conceptStruggleMap.entries())
      .filter(([_, data]) => data.strugglingCount > 0)
      .sort((a, b) => b[1].strugglingCount - a[1].strugglingCount)
      .slice(0, 5)
      .map(([knowledgeId, data]) => ({
        knowledgeId,
        title: data.title,
        strugglingStudents: data.strugglingCount,
        averageMastery: Number(
          (data.scores.reduce((sum, v) => sum + v, 0) / data.scores.length).toFixed(2),
        ),
      }));

    return {
      classId,
      totalStudents,
      objectiveProgress,
      masteryDistribution: { mastered, developing, struggling },
      reviewDueCount,
      remediationCount,
      teacherInterventionCount,
      topLearningSignals,
    };
  }

  /**
   * Purpose-limited, privacy-safe learner drilldown for an authorized teacher.
   */
  async getLearnerDrilldown(
    learnerId: string,
    teacherId: string,
    tenantId: string = 'default-tenant',
  ) {
    const states = await this.prisma.learnerKnowledgeState.findMany({
      where: { learnerId, tenantId },
      include: { knowledgeObject: { select: { title: true, type: true } } },
      orderBy: { lastActivityAt: 'desc' },
    });

    const recentEvidence = await this.prisma.learningEvidenceLog.findMany({
      where: { userId: learnerId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const session = await this.prisma.adaptiveSession.findUnique({
      where: { tenantId_learnerId: { tenantId, learnerId } },
    });

    return {
      learnerId,
      currentAction: session?.currentAction || 'PRACTICE',
      interventionLevel: session?.interventionLevel || 0,
      concepts: states.map((s: any) => ({
        knowledgeId: s.knowledgeObjectId,
        title: s.knowledgeObject?.title || 'Concept',
        type: s.knowledgeObject?.type || 'LESSON',
        masteryLevel: s.masteryLevel,
        confidence: s.confidence,
        status: s.status,
        attempts: s.attempts,
        correctAttempts: s.correctAttempts,
      })),
      recentEvidence: recentEvidence.map((e) => ({
        id: e.id,
        accuracy: e.accuracy,
        attemptNumber: e.attemptNumber,
        hintCount: e.hintCount,
        createdAt: e.createdAt,
      })),
    };
  }
}
