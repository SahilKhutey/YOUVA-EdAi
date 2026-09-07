export type InterventionType =
  | 'PRACTICE'
  | 'HINT'
  | 'EXPLANATION'
  | 'REMEDIATION'
  | 'REASSESSMENT'
  | 'TEACHER_REVIEW'
  | 'PARENT_VISIBILITY'
  | 'CURRICULUM_ADJUSTMENT'
  | 'ENRICHMENT';

export interface InterventionPlan {
  learnerId: string;
  tenantId: string;
  triggerSignalId: string;
  type: InterventionType;
  targetConceptId?: string;
  priority: number;
  rationale: string;
  requiresTeacherApproval: boolean;
  expiresAt?: string;
}

const transitions: Record<string, string[]> = {
  PROPOSED: ['APPROVED', 'REJECTED'],
  APPROVED: ['SCHEDULED'],
  SCHEDULED: ['IN_PROGRESS'],
  IN_PROGRESS: ['EVALUATING'],
  EVALUATING: ['SUCCESS', 'PARTIAL', 'FAILED'],
};

/**
 * Validates and executes governed intervention state transitions.
 */
export function transitionIntervention(current: string, next: string): string {
  if (!transitions[current]?.includes(next)) {
    throw new Error(`Invalid intervention transition: ${current} -> ${next}`);
  }
  return next;
}

export interface TeacherInterventionDecision {
  interventionId: string;
  teacherId: string;
  decision: 'APPROVE' | 'MODIFY' | 'REJECT';
  rationale: string;
}
