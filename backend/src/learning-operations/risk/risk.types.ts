export interface RiskScoreInput {
  masteryRisk: number;
  misconceptionRisk: number;
  assessmentRisk: number;
  goalDrift: number;
  engagementRisk: number;
  evidenceConfidence: number;
}

/**
 * Calculates a multi-factor operational learning risk score.
 * Formula:
 * 0.25 * masteryRisk + 0.20 * misconceptionRisk + 0.20 * assessmentRisk +
 * 0.15 * goalDrift + 0.10 * engagementRisk + 0.10 * (1 - evidenceConfidence)
 */
export function calculateRisk(input: RiskScoreInput): number {
  return (
    input.masteryRisk * 0.25 +
    input.misconceptionRisk * 0.20 +
    input.assessmentRisk * 0.20 +
    input.goalDrift * 0.15 +
    input.engagementRisk * 0.10 +
    (1 - input.evidenceConfidence) * 0.10
  );
}

/**
 * Categorizes operational risk into discrete attention tiers.
 * Invariant: Risk level is an operational attention trigger, NOT a clinical diagnosis.
 */
export function riskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 0.75) return 'HIGH';
  if (score >= 0.45) return 'MEDIUM';
  return 'LOW';
}
