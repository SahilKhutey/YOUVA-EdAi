/**
 * YOUVA-EdAI: Learner-State Boundary (LKC-0)
 * 
 * Boundary Interface: Connects evidence updates to the repository's
 * existing learner-state, BKT, and cognitive twin services.
 * 
 * Invariant: Layer A (Canonical Knowledge) is never mutated when
 * learner state or mastery estimates change.
 */

export interface LearnerMasterySnapshot {
  learnerId: string;
  knowledgeId: string;
  pMastery: number; // 0.00 to 1.00
  masteryBand: 'NOVICE' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  stabilityScore: number;
  lastPracticedAt: Date;
  nextReviewScheduledAt?: Date;
}

export interface ILearnerStateBoundary {
  /**
   * Retrieves the current mastery state for a learner on a canonical knowledge object.
   */
  getLearnerMastery(
    tenantId: string,
    learnerId: string,
    knowledgeId: string,
  ): Promise<LearnerMasterySnapshot | null>;

  /**
   * Updates learner mastery state following an evaluated learning event.
   */
  updateMasteryFromEvidence(
    tenantId: string,
    learnerId: string,
    knowledgeId: string,
    knowledgeVersion: number,
    evidenceQuality: number,
    isCorrect: boolean,
  ): Promise<LearnerMasterySnapshot>;
}
