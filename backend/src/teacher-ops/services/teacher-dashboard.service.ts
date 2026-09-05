import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';
import { GateState } from '../../learning-loop/domain/enums';

@Injectable()
export class TeacherDashboardService {
  private readonly logger = new Logger(TeacherDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  /**
   * Retrieves high-level teacher dashboard KPIs, risk alerts, and instructional cohorts.
   */
  async getDashboardOverview(teacherId: string) {
    const studentIds = await this.scopeAuth.getScopedStudentIds(teacherId);

    // 1. Classes taught by teacher
    const classes = await this.prisma.teacherClass.findMany({
      where: { teacherId },
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (studentIds.length === 0) {
      return {
        metrics: {
          totalStudents: 0,
          activeClasses: classes.length,
          pendingInterventions: 0,
          urgentEscalations: 0,
          avgCohortMastery: 0.0,
          aiAgreementRate: 100.0,
          overrideRate: 0.0,
        },
        classes,
        attentionQueue: [],
        recentActivity: [],
      };
    }

    // 2. Interventions and escalations in scope
    const [pendingInterventions, urgentEscalations, studentMasteries, decisions] =
      await Promise.all([
        this.prisma.teacherIntervention.count({
          where: {
            studentId: { in: studentIds },
            status: 'PENDING',
          },
        }),
        this.prisma.escalationEvent.count({
          where: {
            userId: { in: studentIds },
            status: { in: ['OPEN', 'IN_REVIEW'] },
          },
        }),
        this.prisma.userTopicMastery.findMany({
          where: { userId: { in: studentIds } },
          select: { masteryProbability: true, userId: true },
        }),
        this.prisma.personalizationDecision.findMany({
          where: { userId: { in: studentIds } },
          select: { status: true },
        }),
      ]);

    // 3. Compute Cohort Mastery
    const avgCohortMastery =
      studentMasteries.length > 0
        ? studentMasteries.reduce((sum, m) => sum + m.masteryProbability, 0) /
          studentMasteries.length
        : 0.0;

    // 4. Compute AI Agreement / Override Rate
    const totalDecisions = decisions.length;
    const overriddenCount = decisions.filter((d) => d.status === 'OVERRIDDEN').length;
    const overrideRate = totalDecisions > 0 ? (overriddenCount / totalDecisions) * 100 : 0.0;
    const aiAgreementRate = 100 - overrideRate;

    // 5. Build Attention Queue (Students needing educator eyes)
    const atRiskStudents = await this.prisma.user.findMany({
      where: {
        id: { in: studentIds },
        OR: [
          { topicMastery: { some: { masteryProbability: { lt: 0.4 } } } },
          { cognitiveStateLogs: { some: { cognitiveLoad: { gt: 0.75 } } } },
          { escalationEvents: { some: { status: { in: ['OPEN', 'IN_REVIEW'] } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        gradeLevel: true,
        topicMastery: {
          select: { masteryProbability: true, topic: { select: { title: true } } },
          take: 3,
        },
        cognitiveStateLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { cognitiveLoad: true, inferredState: true },
        },
        escalationEvents: {
          where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
          select: { severity: true, reason: true },
        },
      },
      take: 10,
    });

    return {
      metrics: {
        totalStudents: studentIds.length,
        activeClasses: classes.length,
        pendingInterventions,
        urgentEscalations,
        avgCohortMastery: parseFloat(avgCohortMastery.toFixed(2)),
        aiAgreementRate: parseFloat(aiAgreementRate.toFixed(1)),
        overrideRate: parseFloat(overrideRate.toFixed(1)),
      },
      classes,
      attentionQueue: atRiskStudents,
    };
  }

  /**
   * Retrieves list of students in teacher scope with summary indicators.
   */
  async getScopedStudents(teacherId: string) {
    const studentIds = await this.scopeAuth.getScopedStudentIds(teacherId);

    if (studentIds.length === 0) {
      return [];
    }

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        name: true,
        email: true,
        gradeLevel: true,
        cognitiveLevel: true,
        stats: true,
        topicMastery: {
          select: {
            masteryProbability: true,
            difficultyState: true,
            topic: { select: { id: true, title: true } },
          },
        },
        cognitiveStateLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        studentInterventions: {
          where: { status: 'PENDING' },
          select: { id: true, action: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return students.map((s) => {
      const avgMastery =
        s.topicMastery.length > 0
          ? s.topicMastery.reduce((acc, m) => acc + m.masteryProbability, 0) /
            s.topicMastery.length
          : 0.1;

      return {
        id: s.id,
        name: s.name || s.email,
        email: s.email,
        gradeLevel: s.gradeLevel,
        cognitiveLevel: s.cognitiveLevel,
        totalXp: s.stats?.totalXp || 0,
        currentStreak: s.stats?.streakDays || 0,
        averageMastery: parseFloat(avgMastery.toFixed(2)),
        pendingInterventionCount: s.studentInterventions.length,
        latestCognitiveState: s.cognitiveStateLogs[0]?.inferredState || 'nominal',
      };
    });
  }
}
