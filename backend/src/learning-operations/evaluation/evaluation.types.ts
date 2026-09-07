export interface InterventionOutcome {
  interventionId: string;
  baseline: {
    mastery: number;
    confidence: number;
  };
  postIntervention: {
    mastery: number;
    confidence: number;
  };
  evidenceCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'INCONCLUSIVE';
}

/**
 * Calculates empirical outcome delta between baseline and post-intervention assessment.
 */
export function calculateOutcome(
  baseline: number,
  after: number,
  threshold = 0.10,
): 'SUCCESS' | 'PARTIAL' | 'FAILED' {
  const improvement = after - baseline;

  if (improvement >= threshold) {
    return 'SUCCESS';
  }

  if (improvement > 0) {
    return 'PARTIAL';
  }

  return 'FAILED';
}

export interface RecommendationOutcome {
  accepted: boolean;
  completed: boolean;
  teacherModified: boolean;
  learningImprovement: number;
  safetyIssue: boolean;
}

/**
 * Scores the empirical efficacy and governance alignment of an AI recommendation.
 * Invariant: Any safety issue drops recommendation quality to 0 immediately.
 */
export function recommendationQuality(
  outcome: RecommendationOutcome,
): number {
  if (outcome.safetyIssue) {
    return 0;
  }

  return (
    (outcome.accepted ? 0.20 : 0) +
    (outcome.completed ? 0.20 : 0) +
    (!outcome.teacherModified ? 0.15 : 0) +
    Math.max(
      0,
      Math.min(
        1,
        outcome.learningImprovement,
      ),
    ) * 0.45
  );
}
