import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { PolicyEngineService } from '../policy/policy-engine.service';
import { ActivityType, Modality, Pacing, DecisionStatus, ActorType } from '../domain/enums';
import { StudentLearningContext, PersonalizationRecommendation } from '../domain/types';

@Injectable()
export class PersonalizationEngineService {
  private readonly logger = new Logger(PersonalizationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: LearningLoopAuditService,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  /**
   * Builds the comprehensive student learning context.
   */
  async buildStudentContext(userId: string, topicId: string): Promise<StudentLearningContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    });

    const masteryRecord = await this.prisma.userTopicMastery.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    const latestCognitiveLog = await this.prisma.cognitiveStateLog.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    const recentMistakes = await this.prisma.mistakeLog.findMany({
      where: { userId, topicId, isResolved: false },
      take: 5,
    });

    const activeGoals = await this.prisma.studyGoal.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      take: 3,
    });

    return {
      userId,
      topicId,
      subjectName: topic?.subject?.name,
      topicTitle: topic?.title,
      cognitiveLevel: user.cognitiveLevel || 'TEEN',
      gradeLevel: user.gradeLevel,
      currentMastery: masteryRecord?.masteryProbability ?? 0.1,
      currentDifficulty: masteryRecord?.difficultyState ?? 0.5,
      cognitiveLoad: latestCognitiveLog?.cognitiveLoad ?? 0.2,
      errorClusterScore: latestCognitiveLog?.errorClusterScore ?? 0.1,
      inferredState: latestCognitiveLog?.inferredState ?? 'flow',
      recentMistakes: recentMistakes.map((m) => m.description),
      activeGoals: activeGoals.map((g) => ({ id: g.id, targetScore: g.targetScore, title: g.title })),
    };
  }

  /**
   * Computes a deterministic next-action recommendation based on cognitive state and mastery.
   */
  async generateRecommendation(
    context: StudentLearningContext,
  ): Promise<{ decisionId: string; recommendation: PersonalizationRecommendation }> {
    const { currentMastery, currentDifficulty, cognitiveLoad, errorClusterScore, cognitiveLevel, recentMistakes } =
      context;

    // 1. Deterministic Activity Selection
    let activityType: ActivityType;
    let rationale: string;

    if (recentMistakes.length > 0 && currentMastery < 0.4) {
      activityType = ActivityType.REMEDIATION;
      rationale = `Targeted remediation selected due to ${recentMistakes.length} active misconceptions.`;
    } else if (currentMastery < 0.35) {
      activityType = ActivityType.EXPLANATION;
      rationale = 'Foundational conceptual breakdown selected to scaffold baseline understanding.';
    } else if (currentMastery >= 0.35 && currentMastery < 0.70) {
      activityType = ActivityType.PRACTICE;
      rationale = 'Adaptive practice selected to solidify procedural fluency.';
    } else if (currentMastery >= 0.70 && currentMastery < 0.85) {
      activityType = ActivityType.SOCRATIC_DIALOGUE;
      rationale = 'Socratic dialogue selected to challenge conceptual boundaries and deep transfer.';
    } else {
      activityType = ActivityType.CHALLENGE;
      rationale = 'High mastery demonstrated. Advanced challenge problem selected to expand zone of proximal development.';
    }

    // 2. Deterministic Modality Selection
    let modality: Modality;
    if (cognitiveLevel === 'CHILD') {
      modality = Modality.INTERACTIVE;
    } else if (cognitiveLoad > 0.65) {
      modality = Modality.VISUAL; // Lower cognitive strain via visual diagrammatic representations
    } else if (cognitiveLevel === 'ADULT') {
      modality = Modality.TEXT;
    } else {
      modality = Modality.INTERACTIVE;
    }

    // 3. Deterministic Pacing
    let pacing: Pacing;
    if (cognitiveLoad > 0.70 || errorClusterScore > 0.60) {
      pacing = Pacing.SLOW;
    } else if (currentMastery >= 0.80 && cognitiveLoad < 0.40) {
      pacing = Pacing.ACCELERATED;
    } else {
      pacing = Pacing.STANDARD;
    }

    // 4. Invariant: AI CAN NEVER CERTIFY MASTERY
    const isCertifiedMastery = this.policyEngine.enforceMasteryCertificationRule(false);

    const recommendation: PersonalizationRecommendation = {
      activityType,
      difficulty: currentDifficulty,
      modality,
      pacing,
      recommendationRationale: rationale,
      isCertifiedMastery: false,
      interventionSuggested: cognitiveLoad > 0.75 || errorClusterScore > 0.65,
    };

    // 5. Persist Decision Record in DB
    const decisionRecord = await this.prisma.personalizationDecision.create({
      data: {
        userId: context.userId,
        topicId: context.topicId,
        activityType: recommendation.activityType,
        difficulty: recommendation.difficulty,
        modality: recommendation.modality,
        pacing: recommendation.pacing,
        recommendationRationale: recommendation.recommendationRationale,
        isCertifiedMastery: false, // Strict invariant
        status: DecisionStatus.PROPOSED,
      },
    });

    // 6. Record Audit
    await this.auditService.logAction({
      userId: context.userId,
      actorType: ActorType.AI,
      actorId: 'AI_PERSONALIZATION_ENGINE',
      action: 'DECISION_PROPOSED',
      stateBefore: { currentMastery, currentDifficulty },
      stateAfter: { decisionId: decisionRecord.id, recommendation },
    });

    return {
      decisionId: decisionRecord.id,
      recommendation,
    };
  }
}
