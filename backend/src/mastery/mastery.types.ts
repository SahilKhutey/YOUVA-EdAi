export type MasteryStatus =
  | 'NOT_STARTED'
  | 'LEARNING'
  | 'STRUGGLING'
  | 'DEVELOPING'
  | 'MASTERED'
  | 'NEEDS_REVIEW';

export interface EvidenceEvaluationInput {
  attempts: number;
  correctAttempts: number;
  streakCount: number;
  hintsUsed: number;
  explanationsRequested: number;
  averageDifficulty?: number;
  lastActivityAt?: Date | null;
  observedAt?: Date;
}

export interface MasteryEvaluationResult {
  masteryLevel: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  status: MasteryStatus;
  struggleScore: number; // 0.0 - 1.0
  isStruggling: boolean;
  nextReviewAt: Date | null;
}
