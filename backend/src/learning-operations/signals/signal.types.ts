export type LearningSignalType =
  | 'MASTERY_DECLINE'
  | 'REPEATED_MISCONCEPTION'
  | 'ENGAGEMENT_DECLINE'
  | 'ASSESSMENT_RISK'
  | 'GOAL_DRIFT'
  | 'LEARNING_VELOCITY_DECLINE'
  | 'PREREQUISITE_GAP'
  | 'HIGH_CONFIDENCE'
  | 'MASTERY_BREAKTHROUGH'
  | 'INTERVENTION_SUCCESS'
  | 'INTERVENTION_FAILURE';

export interface LearningSignal {
  id: string;
  learnerId: string;
  tenantId: string;
  type: LearningSignalType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  conceptId?: string;
  evidenceIds: string[];
  detectedAt: string;
  expiresAt?: string;
}

/**
 * Detects significant mastery decline between assessment intervals.
 */
export function detectMasteryDecline(
  previousMastery: number,
  currentMastery: number,
): boolean {
  return previousMastery - currentMastery >= 0.15;
}

/**
 * Detects repeated misconceptions on identical or related learning concepts.
 */
export function detectRepeatedMisconception(
  misconceptionCount: number,
): boolean {
  return misconceptionCount >= 3;
}
