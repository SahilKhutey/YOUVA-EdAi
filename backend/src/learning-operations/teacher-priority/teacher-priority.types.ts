export interface InterventionCluster {
  conceptId?: string;
  signalType: string;
  learnerCount: number;
  averageSeverity: number;
  recommendedAction: string;
}

export interface TeacherPriorityInput {
  severity: number;
  learnerImpact: number;
  evidenceConfidence: number;
  urgency: number;
  interventionAge: number;
}

/**
 * Calculates unified teacher queue priority to optimize teacher cognitive workload.
 * Formula:
 * 0.30 * severity + 0.25 * learnerImpact + 0.15 * evidenceConfidence +
 * 0.20 * urgency + 0.10 * interventionAge
 */
export function calculateTeacherPriority(input: TeacherPriorityInput): number {
  return (
    input.severity * 0.30 +
    input.learnerImpact * 0.25 +
    input.evidenceConfidence * 0.15 +
    input.urgency * 0.20 +
    input.interventionAge * 0.10
  );
}
