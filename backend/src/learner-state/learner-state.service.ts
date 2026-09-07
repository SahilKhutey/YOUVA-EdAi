import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UnifiedLearnerState,
  TopicMasterySnapshot,
  CognitiveTwinSnapshot,
  SafetyAndConsentBoundary,
  TeacherOverrideSnapshot,
  ReadinessEvaluationResult,
} from './learner-state.types';

@Injectable()
export class LearnerStateService {
  private readonly logger = new Logger(LearnerStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate a holistic, authoritative Unified Learner State snapshot.
   */
  async getUnifiedLearnerSnapshot(
    studentId: string,
    tenantId?: string,
  ): Promise<UnifiedLearnerState> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        stats: true,
        cognitiveProfile: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student [${studentId}] not found`);
    }

    // Parallel fetch across independent sub-domains
    const [
      topicMasteries,
      openEscalations,
      parentConsents,
      teacherInterventions,
      studyGoals,
    ] = await Promise.all([
      this.prisma.userTopicMastery.findMany({
        where: { userId: studentId },
        include: { topic: { include: { subject: true } } },
      }),
      this.prisma.safetyEscalation.findMany({
        where: {
          studentId,
          status: { in: ['OPEN', 'IN_REVIEW'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.consentRecord.findMany({
        where: { studentId },
      }),
      this.prisma.teacherIntervention.findMany({
        where: {
          studentId,
          action: 'OVERRIDE',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.studyGoal.findMany({
        where: { userId: studentId },
        take: 5,
      }),
    ]);

    // 1. Mastery Vector Compilation
    const masteryVector: Record<string, TopicMasterySnapshot> = {};
    let totalMasterySum = 0;

    for (const record of topicMasteries) {
      masteryVector[record.topicId] = {
        topicId: record.topicId,
        topicTitle: record.topic?.title,
        subjectName: record.topic?.subject?.name,
        mastery: record.mastery,
        certifiedByTeacher: record.certifiedMastery || false,
        certifiedAt: record.certifiedAt?.toISOString(),
        lastEvidenceAt: record.updatedAt?.toISOString(),
      };
      totalMasterySum += record.mastery;
    }

    const overallAverageMastery =
      topicMasteries.length > 0
        ? Math.round((totalMasterySum / topicMasteries.length) * 100) / 100
        : 0;

    // 2. Cognitive Profile Synthesis
    const cp = student.cognitiveProfile;
    const cognitiveProfile: CognitiveTwinSnapshot = {
      workingMemory: cp?.workingMemory ?? 0.7,
      processingSpeed: cp?.processingSpeed ?? 0.7,
      fatigueIndex: cp?.fatigueIndex ?? 0.1,
      focusIndex: cp?.focusIndex ?? 0.8,
      inferredState: cp?.inferredState ?? 'flow',
      updatedTimestamp: cp?.updatedAt?.toISOString(),
    };

    // 3. Safety & Consent Boundaries
    let highestSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
    const severityRanks = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

    for (const esc of openEscalations) {
      const sev = esc.severity.toUpperCase() as keyof typeof severityRanks;
      if (severityRanks[sev] && severityRanks[sev] > severityRanks[highestSeverity]) {
        highestSeverity = sev;
      }
    }

    const hasActiveConsent = parentConsents.some(
      (c) => c.status === 'GRANTED' && c.consentType === 'AI_CURRICULUM_PERSONALIZATION',
    );

    const safetyAndConsent: SafetyAndConsentBoundary = {
      parentConsentGranted: parentConsents.length === 0 || hasActiveConsent, // Default true if self-enrolled, bounded if records exist
      restrictedDataProcessing: parentConsents.some((c) => c.status === 'REVOKED'),
      activeEscalationSeverity: highestSeverity,
      openEscalationCount: openEscalations.length,
      hasActiveTeacherIntervention: teacherInterventions.length > 0,
    };

    // 4. Active Teacher Overrides (Authoritative human instruction)
    const activeTeacherOverrides: Record<string, TeacherOverrideSnapshot> = {};

    for (const intervention of teacherInterventions) {
      let details: any = {};
      if (intervention.overrideDetails) {
        try {
          details = JSON.parse(intervention.overrideDetails);
        } catch {
          details = {};
        }
      }

      const targetTopicId = details.topicId || 'GLOBAL';
      if (!activeTeacherOverrides[targetTopicId]) {
        activeTeacherOverrides[targetTopicId] = {
          interventionId: intervention.id,
          teacherId: intervention.teacherId,
          topicId: details.topicId,
          mandatedDifficulty: details.difficulty,
          mandatedModality: details.modality,
          customPacing: details.pacing,
          teacherNotes: intervention.feedback || details.notes,
          appliedAt: intervention.createdAt.toISOString(),
        };
      }
    }

    // 5. Active Goals Formatting
    const formattedGoals = studyGoals.map((g) => ({
      id: g.id,
      title: g.title,
      targetScore: g.targetScore,
      currentProgress: g.currentScore,
    }));

    return {
      studentId: student.id,
      studentName: student.name ?? undefined,
      cognitiveLevel: student.cognitiveLevel,
      gradeLevel: student.gradeLevel,
      tenantId: tenantId ?? null,
      masteryVector,
      overallAverageMastery,
      cognitiveProfile,
      safetyAndConsent,
      activeTeacherOverrides,
      activeGoals: formattedGoals,
      learningLoopTelemetry: {
        recentAccuracy: 0.85,
        errorClusterScore: 0.15,
        streakDays: student.stats?.streakDays ?? 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluate learner readiness for a specific topic, enforcing teacher supremacy and safety invariants.
   */
  async evaluateReadiness(
    studentId: string,
    topicId: string,
    tenantId?: string,
  ): Promise<ReadinessEvaluationResult> {
    const snapshot = await this.getUnifiedLearnerSnapshot(studentId, tenantId);

    // Invariant 1: Severe safety escalation halts automated progression
    if (
      snapshot.safetyAndConsent.activeEscalationSeverity === 'HIGH' ||
      snapshot.safetyAndConsent.activeEscalationSeverity === 'CRITICAL'
    ) {
      return {
        ready: false,
        effectiveDifficulty: 0.1,
        reason: `Active safety escalation [${snapshot.safetyAndConsent.activeEscalationSeverity}]. Progression halted pending teacher or counselor review.`,
        isTeacherOverridden: false,
        safetyHalted: true,
      };
    }

    // Invariant 2: Revoked consent restricts automated personalization
    if (snapshot.safetyAndConsent.restrictedDataProcessing) {
      return {
        ready: true,
        effectiveDifficulty: 0.5,
        reason: 'Parent revoked advanced AI personalization; falling back to standard curriculum default pacing.',
        isTeacherOverridden: false,
        safetyHalted: false,
      };
    }

    // Invariant 3: Teacher override strictly supersedes AI recommendations
    const override =
      snapshot.activeTeacherOverrides[topicId] ||
      snapshot.activeTeacherOverrides['GLOBAL'];

    if (override && override.mandatedDifficulty !== undefined) {
      return {
        ready: true,
        effectiveDifficulty: override.mandatedDifficulty,
        mandatedModality: override.mandatedModality,
        reason: `Teacher override enforced by instructor [${override.teacherId}]: ${override.teacherNotes || 'Mandated custom pacing'}`,
        isTeacherOverridden: true,
        safetyHalted: false,
      };
    }

    // Invariant 4: Cognitive Twin fatigue threshold check
    if (snapshot.cognitiveProfile.fatigueIndex > 0.75) {
      return {
        ready: false,
        effectiveDifficulty: 0.2,
        reason: `Learner fatigue index is high (${snapshot.cognitiveProfile.fatigueIndex}). Recommend a pause or reflective micro-practice.`,
        isTeacherOverridden: false,
        safetyHalted: false,
      };
    }

    // Standard BKT-based progression
    const currentTopicMastery = snapshot.masteryVector[topicId]?.mastery ?? 0.1;
    // Calibrate difficulty based on mastery (BKT zone of proximal development)
    const effectiveDifficulty = Math.min(1.0, Math.max(0.2, currentTopicMastery + 0.1));

    return {
      ready: true,
      effectiveDifficulty: Math.round(effectiveDifficulty * 100) / 100,
      reason: `Zone of proximal development calibrated from current mastery (${currentTopicMastery}).`,
      isTeacherOverridden: false,
      safetyHalted: false,
    };
  }
}
