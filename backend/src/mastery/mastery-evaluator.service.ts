import { Injectable } from '@nestjs/common';
import {
  EvidenceEvaluationInput,
  MasteryEvaluationResult,
  MasteryStatus,
} from './mastery.types';

@Injectable()
export class MasteryEvaluatorService {
  // Mastery formula weights
  private readonly WEIGHT_ACCURACY = 0.45;
  private readonly WEIGHT_CONSISTENCY = 0.20;
  private readonly WEIGHT_DIFFICULTY = 0.20;
  private readonly WEIGHT_RECENCY = 0.15;
  private readonly HINT_PENALTY_RATE = 0.04;

  /**
   * Evaluates raw learner evidence into a deterministic multi-factor mastery model.
   * Enforces:
   *   1. Engagement alone never produces competency/mastery.
   *   2. Insufficient evidence keeps confidence low to prevent premature mastery declaration.
   *   3. Struggle is detected early to trigger remediation.
   */
  evaluate(input: EvidenceEvaluationInput): MasteryEvaluationResult {
    const {
      attempts,
      correctAttempts,
      streakCount,
      hintsUsed,
      explanationsRequested,
      averageDifficulty = 0.5,
      lastActivityAt,
      observedAt = new Date(),
    } = input;

    // 0. No evidence -> NOT_STARTED
    if (attempts === 0) {
      return {
        masteryLevel: 0.0,
        confidence: 0.0,
        status: 'NOT_STARTED',
        struggleScore: 0.0,
        isStruggling: false,
        nextReviewAt: null,
      };
    }

    // 1. Accuracy Component (0.0 - 1.0)
    const accuracy = attempts > 0 ? correctAttempts / attempts : 0.0;

    // 2. Consistency Component (0.0 - 1.0)
    // Up to 5 consecutive correct answers gives full consistency bonus
    const consistency = Math.min(1.0, streakCount / 5.0);

    // 3. Difficulty Component (0.1 - 0.9)
    const difficulty = Math.min(1.0, Math.max(0.1, averageDifficulty));

    // 4. Recency Component (0.0 - 1.0)
    let recency = 1.0;
    let daysSinceLast = 0;
    if (lastActivityAt) {
      daysSinceLast = Math.max(
        0,
        (observedAt.getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      // Exponential decay: half-life ~30 days
      recency = Math.exp(-daysSinceLast / 30.0);
    }

    // 5. Support Dependency Penalty
    const hintPenalty = Math.min(0.20, hintsUsed * this.HINT_PENALTY_RATE);

    // 6. Multi-evidence Mastery Score
    const rawMastery =
      this.WEIGHT_ACCURACY * accuracy +
      this.WEIGHT_CONSISTENCY * consistency +
      this.WEIGHT_DIFFICULTY * difficulty +
      this.WEIGHT_RECENCY * recency -
      hintPenalty;

    const masteryLevel = Math.round(Math.min(1.0, Math.max(0.0, rawMastery)) * 1000) / 1000;

    // 7. Evidence Confidence C = 1 - 1 / sqrt(attempts + 1)
    const confidence = Math.round((1.0 - 1.0 / Math.sqrt(attempts + 1)) * 1000) / 1000;

    // 8. Struggle Detection
    // Conditions: 3+ consecutive errors OR (accuracy < 0.40 && attempts >= 3) OR heavy hint/explanation dependency
    const consecutiveErrors = attempts > correctAttempts ? attempts - correctAttempts : 0;
    let struggleScore = 0.0;

    if (consecutiveErrors >= 3 || (accuracy < 0.40 && attempts >= 3)) {
      struggleScore += 0.50;
    }
    if (hintsUsed >= 3) {
      struggleScore += 0.25;
    }
    if (explanationsRequested >= 2) {
      struggleScore += 0.25;
    }
    struggleScore = Math.min(1.0, struggleScore);
    const isStruggling = struggleScore >= 0.50;

    // 9. Status Classification
    let status: MasteryStatus = 'LEARNING';

    if (isStruggling) {
      status = 'STRUGGLING';
    } else if (daysSinceLast > 14 && attempts >= 3) {
      status = 'NEEDS_REVIEW';
    } else if (masteryLevel >= 0.85 && confidence >= 0.68) {
      status = 'MASTERED';
    } else if (masteryLevel >= 0.50 && attempts >= 3) {
      status = 'DEVELOPING';
    } else {
      status = 'LEARNING';
    }

    // 10. Next Spaced Review Date (if MASTERED or DEVELOPING)
    let nextReviewAt: Date | null = null;
    if (status === 'MASTERED') {
      // 14 days later
      nextReviewAt = new Date(observedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (status === 'DEVELOPING') {
      // 7 days later
      nextReviewAt = new Date(observedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return {
      masteryLevel,
      confidence,
      status,
      struggleScore,
      isStruggling,
      nextReviewAt,
    };
  }
}
