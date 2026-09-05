import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';

@Injectable()
export class Student360Service {
  private readonly logger = new Logger(Student360Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  /**
   * Builds the comprehensive Student 360 diagnostic profile.
   * STRICT: Validates teacher scope before returning diagnostic data.
   */
  async getStudent360(teacherId: string, studentId: string) {
    // 1. Verify Scope Authorization
    await this.scopeAuth.assertTeacherStudentScope(teacherId, studentId);

    // 2. Query Student Profile & Linked Learning Entities
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        stats: true,
        cognitiveProfile: true,
        topicMastery: {
          include: { topic: { include: { subject: true } } },
        },
        mistakeLogs: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        cognitiveStateLogs: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        studyGoals: {
          where: { status: 'IN_PROGRESS' },
        },
        learningEvidenceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { topic: true },
        },
        personalizationDecisions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { topic: true },
        },
        studentInterventions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { teacher: { select: { name: true, email: true } } },
        },
        escalationEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    // 3. Compute Concept Strengths & Weaknesses
    const strengths: Array<{ topic: string; subject: string; score: number }> = [];
    const weaknesses: Array<{ topic: string; subject: string; score: number }> = [];

    student.topicMastery.forEach((m) => {
      const entry = {
        topic: m.topic.title,
        subject: m.topic.subject.name,
        score: parseFloat(m.masteryProbability.toFixed(2)),
      };
      if (m.masteryProbability >= 0.75) {
        strengths.push(entry);
      } else if (m.masteryProbability < 0.40) {
        weaknesses.push(entry);
      }
    });

    // 4. Derive Recommended Intervention
    let recommendedIntervention = 'Maintain nominal learning progression.';
    const latestCognitive = student.cognitiveStateLogs[0];
    const openEscalation = student.escalationEvents.find((e) => e.status !== 'RESOLVED');

    if (openEscalation) {
      recommendedIntervention = `SAFETY ALERT [${openEscalation.severity}]: Direct educator intervention required. ${openEscalation.reason}`;
    } else if (latestCognitive && latestCognitive.cognitiveLoad > 0.8) {
      recommendedIntervention =
        'High cognitive strain detected. Recommend visual scaffolding and reduced step complexity.';
    } else if (weaknesses.length >= 3) {
      recommendedIntervention =
        'Foundational review recommended across: ' +
        weaknesses.map((w) => w.topic).slice(0, 3).join(', ');
    }

    return {
      studentId: student.id,
      profile: {
        name: student.name || 'Unnamed Student',
        email: student.email,
        gradeLevel: student.gradeLevel || 'Not specified',
        cognitiveLevel: student.cognitiveLevel,
        onboardingComplete: student.onboardingComplete,
        currentStreak: student.stats?.streakDays || 0,
        totalXp: student.stats?.totalXp || 0,
        learningVelocity: student.cognitiveProfile?.learningVelocityIndex || 1.0,
      },
      currentMastery: student.topicMastery.map((m) => ({
        topicId: m.topicId,
        topicName: m.topic.title,
        subjectName: m.topic.subject.name,
        masteryProbability: parseFloat(m.masteryProbability.toFixed(2)),
        targetDifficulty: parseFloat(m.difficultyState.toFixed(2)),
      })),
      conceptStrengths: strengths,
      conceptWeaknesses: weaknesses,
      recentMistakes: student.mistakeLogs.map((m) => ({
        id: m.id,
        description: m.description,
        topicId: m.topicId,
        createdAt: m.createdAt,
      })),
      recentEvidence: student.learningEvidenceLogs.map((e) => ({
        id: e.id,
        topicName: e.topic.title,
        accuracy: e.accuracy,
        attemptNumber: e.attemptNumber,
        hintCount: e.hintCount,
        misconception: e.misconception,
        submittedAt: e.createdAt,
      })),
      cognitiveState: latestCognitive
        ? {
            cognitiveLoad: latestCognitive.cognitiveLoad,
            errorClusterScore: latestCognitive.errorClusterScore,
            inferredState: latestCognitive.inferredState,
            retrievalStrength: latestCognitive.retrievalStrength,
            attentionSwitching: latestCognitive.attentionSwitching,
            lastLoggedAt: latestCognitive.timestamp,
          }
        : null,
      activeGoals: student.studyGoals.map((g) => ({
        id: g.id,
        title: g.title,
        targetScore: g.targetScore,
      })),
      recentAiDecisions: student.personalizationDecisions.map((d) => ({
        id: d.id,
        topicName: d.topic.title,
        activityType: d.activityType,
        difficulty: d.difficulty,
        status: d.status,
        rationale: d.recommendationRationale,
      })),
      teacherActionHistory: student.studentInterventions.map((i) => ({
        id: i.id,
        action: i.action,
        teacherName: i.teacher.name || i.teacher.email,
        feedback: i.feedback,
        status: i.status,
        timestamp: i.createdAt,
      })),
      recommendedIntervention,
    };
  }
}
