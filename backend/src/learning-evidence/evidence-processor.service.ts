import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryEvaluatorService } from '../mastery/mastery-evaluator.service';
import { LearnerKnowledgeStateService } from '../learner-state/learner-knowledge-state.service';

export interface ProcessEventResult {
  isIdempotentReplay: boolean;
  evidenceLogId: string;
  learnerId: string;
  knowledgeObjectId: string;
  masteryLevel: number;
  confidence: number;
  status: string;
}

@Injectable()
export class EvidenceProcessorService {
  private readonly logger = new Logger(EvidenceProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryEvaluator: MasteryEvaluatorService,
    private readonly learnerStateService: LearnerKnowledgeStateService,
  ) {}

  /**
   * Processes a raw KnowledgeEvent into a normalized LearningEvidenceLog,
   * evaluates mastery, and updates the LearnerKnowledgeState.
   * Enforces strict idempotency via sourceEventId.
   */
  async processEvent(eventId: string): Promise<ProcessEventResult> {
    // 1. Load Event
    const event = await this.prisma.knowledgeEvent.findUnique({
      where: { id: eventId },
      include: { knowledgeObject: true },
    });

    if (!event) {
      throw new NotFoundException(`Knowledge event '${eventId}' not found`);
    }

    const tenantId = event.tenantId || 'default-tenant';
    const learnerId = event.learnerId;
    const knowledgeObjectId = event.knowledgeObjectId;

    // 2. Check Idempotency by sourceEventId
    const existingEvidence = await this.prisma.learningEvidenceLog.findUnique({
      where: { sourceEventId: event.id },
    });

    if (existingEvidence) {
      this.logger.log(
        `Idempotent event replay detected for event '${eventId}'. Returning existing state.`,
      );
      const state = await this.learnerStateService.getState(
        tenantId,
        learnerId,
        knowledgeObjectId,
      );

      return {
        isIdempotentReplay: true,
        evidenceLogId: existingEvidence.id,
        learnerId,
        knowledgeObjectId,
        masteryLevel: state?.masteryLevel ?? 0.0,
        confidence: state?.confidence ?? 0.0,
        status: state?.status ?? 'NOT_STARTED',
      };
    }

    // 3. Parse Event Metadata
    let meta: any = {};
    if (event.metadata) {
      try {
        meta = JSON.parse(event.metadata);
      } catch {
        meta = {};
      }
    }

    // 4. Map Event to Normalized Evidence
    let accuracy = 1.0;
    let isCorrect = false;
    let hintCount = 0;
    let attemptNumber = meta.attempt || 1;
    let evidenceType = 'ENGAGEMENT';
    let answerText = meta.submittedAnswer || event.eventType;

    switch (event.eventType) {
      case 'ANSWERED':
        evidenceType = 'PERFORMANCE';
        isCorrect = Boolean(meta.isCorrect);
        accuracy = isCorrect ? 1.0 : 0.0;
        hintCount = meta.hintUsed ? 1 : 0;
        break;

      case 'REQUESTED_HINT':
        evidenceType = 'SUPPORT_DEPENDENCY';
        hintCount = 1;
        accuracy = 0.5;
        break;

      case 'REQUESTED_EXPLANATION':
        evidenceType = 'SUPPORT_DEPENDENCY';
        accuracy = 0.5;
        break;

      case 'STRUGGLED':
        evidenceType = 'DIFFICULTY';
        accuracy = 0.0;
        break;

      case 'MASTERED':
        evidenceType = 'ACHIEVEMENT';
        accuracy = 1.0;
        break;

      case 'STARTED':
      case 'SECTION_VIEWED':
      case 'COMPLETED':
      default:
        evidenceType = 'ENGAGEMENT';
        accuracy = 1.0;
        break;
    }

    // 5. Persist Normalized LearningEvidenceLog
    const evidenceLog = await this.prisma.learningEvidenceLog.create({
      data: {
        idempotencyKey: `evt_${event.id}`,
        sourceEventId: event.id,
        tenantId,
        userId: learnerId,
        knowledgeObjectId,
        knowledgeVersion: event.knowledgeVersion,
        evidenceType,
        confidence: 0.8,
        answer: String(answerText),
        accuracy,
        attemptNumber,
        hintCount,
        engagementScore: evidenceType === 'ENGAGEMENT' ? 0.3 : 1.0,
        metadata: event.metadata,
      },
    });

    // 6. Fetch Existing Learner Knowledge State to Compute Progressive Updates
    const currentState = await this.learnerStateService.getState(
      tenantId,
      learnerId,
      knowledgeObjectId,
    );

    const prevAttempts = currentState?.attempts || 0;
    const prevCorrect = currentState?.correctAttempts || 0;
    const prevStreak = currentState?.streakCount || 0;

    const isQuestionAttempt = event.eventType === 'ANSWERED';
    const newAttempts = isQuestionAttempt ? prevAttempts + 1 : prevAttempts;
    const newCorrect = isQuestionAttempt && isCorrect ? prevCorrect + 1 : prevCorrect;
    const newStreak = isQuestionAttempt ? (isCorrect ? prevStreak + 1 : 0) : prevStreak;

    // 7. Evaluate Mastery with Multi-Factor Model
    const evaluation = this.masteryEvaluator.evaluate({
      attempts: newAttempts,
      correctAttempts: newCorrect,
      streakCount: newStreak,
      hintsUsed: (meta.hintUsed ? 1 : 0) + (event.eventType === 'REQUESTED_HINT' ? 1 : 0),
      explanationsRequested: event.eventType === 'REQUESTED_EXPLANATION' ? 1 : 0,
      averageDifficulty: 0.5,
      lastActivityAt: currentState?.lastActivityAt,
      observedAt: event.occurredAt,
    });

    // 8. Update LearnerKnowledgeState
    const updatedState = await this.learnerStateService.updateState(
      tenantId,
      learnerId,
      knowledgeObjectId,
      evaluation,
      {
        attemptsIncrement: isQuestionAttempt ? 1 : 0,
        correctAttemptsIncrement: isQuestionAttempt && isCorrect ? 1 : 0,
        streakCount: newStreak,
        observedAt: event.occurredAt,
      },
    );

    return {
      isIdempotentReplay: false,
      evidenceLogId: evidenceLog.id,
      learnerId,
      knowledgeObjectId,
      masteryLevel: updatedState.masteryLevel,
      confidence: updatedState.confidence,
      status: updatedState.status,
    };
  }
}
