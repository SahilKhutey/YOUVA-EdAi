export type OpportunityType =
  | 'ADVANCEMENT'
  | 'ACCELERATION'
  | 'ENRICHMENT'
  | 'TRANSFER'
  | 'LEADERSHIP'
  | 'PROJECT_READINESS';

export interface OpportunityScoreInput {
  mastery: number;
  confidence: number;
  consistency: number;
  goalAlignment: number;
  prerequisiteCompletion: number;
}

/**
 * Calculates a multi-factor operational learning opportunity score.
 * Formula:
 * 0.30 * mastery + 0.20 * confidence + 0.20 * consistency +
 * 0.15 * goalAlignment + 0.15 * prerequisiteCompletion
 */
export function calculateOpportunity(input: OpportunityScoreInput): number {
  return (
    input.mastery * 0.30 +
    input.confidence * 0.20 +
    input.consistency * 0.20 +
    input.goalAlignment * 0.15 +
    input.prerequisiteCompletion * 0.15
  );
}
