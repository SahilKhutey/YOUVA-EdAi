import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BktService } from '../../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../../learning-engine/services/rl-difficulty.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { LearningEvidenceInput } from '../domain/types';
import { ActorType } from '../domain/enums';

export interface ProcessEvidenceResult {
  isIdempotentReplay: boolean;
  evidenceId: string;
  userId: string;
  topicId: string;
  masteryProbability: number;
  targetDifficulty: number;
  accuracy: number;
  isCorrect: boolean;
}

@Injectable()
export class EvidenceProcessorService {
  private readonly logger = new Logger(EvidenceProcessorService.name);

  // Minimum accuracy to count as pedagogically correct
  private readonly ACCURACY_PASSING_THRESHOLD = 0.7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bktService: BktService,
    private readonly rlDifficultyService: RlDifficultyService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Processes learning evidence with strict idempotency and deterministic mastery updates.
   */
  async processEvidence(input: LearningEvidenceInput): Promise<ProcessEvidenceResult> {
    // 1. Check for Idempotency
    const existingEvidence = await this.prisma.learningEvidenceLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });

    if (existingEvidence) {
      this.logger.log(
        `Idempotent submission detected for key ${input.idempotencyKey}. Returning existing record without duplicate mastery mutation.`,
      );

      // Fetch current mastery to return deterministic state
      const currentMasteryRecord = await this.prisma.userTopicMastery.findUnique({
        where: { userId_topicId: { userId: input.userId, topicId: input.topicId } },
      });

      return {
        isIdempotentReplay: true,
        evidenceId: existingEvidence.id,
        userId: existingEvidence.userId,
        topicId: existingEvidence.topicId,
        masteryProbability: currentMasteryRecord?.masteryProbability ?? 0.1,
        targetDifficulty: currentMasteryRecord?.difficultyState ?? 0.5,
        accuracy: existingEvidence.accuracy,
        isCorrect: existingEvidence.accuracy >= this.ACCURACY_PASSING_THRESHOLD,
      };
    }

    const isCorrect = input.accuracy >= this.ACCURACY_PASSING_THRESHOLD;

    // 2. Fetch current difficulty for RL adjustment
    const initialOptimalDifficulty = await this.rlDifficultyService.getOptimalDifficulty(
      input.userId,
      input.topicId,
    );

    // 3. Deterministic Bayesian Knowledge Tracing (BKT) Update
    const newMastery = await this.bktService.updateMastery(
      input.userId,
      input.topicId,
      isCorrect,
    );

    // 4. Deterministic Reinforcement Learning Difficulty Adjustment
    const newDifficulty = await this.rlDifficultyService.updateDifficultyState(
      input.userId,
      input.topicId,
      isCorrect,
      initialOptimalDifficulty,
    );

    // 5. Persist Evidence Log
    const evidenceRecord = await this.prisma.learningEvidenceLog.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        topicId: input.topicId,
        answer: input.answer,
        accuracy: input.accuracy,
        attemptNumber: input.attemptNumber || 1,
        hintCount: input.hintCount || 0,
        misconception: input.misconception ?? null,
        engagementScore: input.engagementScore ?? 1.0,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // 6. Record in Audit Log
    await this.auditService.logAction({
      userId: input.userId,
      actorType: ActorType.STUDENT,
      actorId: input.userId,
      action: 'EVIDENCE_SUBMITTED',
      stateBefore: {
        mastery: initialOptimalDifficulty,
      },
      stateAfter: {
        evidenceId: evidenceRecord.id,
        accuracy: input.accuracy,
        newMastery,
        newDifficulty,
        isCorrect,
      },
    });

    this.logger.log(
      `Evidence processed for user ${input.userId}, topic ${input.topicId}: Mastery=${newMastery.toFixed(3)}, Difficulty=${newDifficulty.toFixed(3)}`,
    );

    return {
      isIdempotentReplay: false,
      evidenceId: evidenceRecord.id,
      userId: input.userId,
      topicId: input.topicId,
      masteryProbability: newMastery,
      targetDifficulty: newDifficulty,
      accuracy: input.accuracy,
      isCorrect,
    };
  }
}
