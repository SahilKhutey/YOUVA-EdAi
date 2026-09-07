export type MilestoneType =
  | 'CONCEPT'
  | 'COMPETENCY'
  | 'ASSESSMENT'
  | 'PROJECT'
  | 'CREDENTIAL';

export type MilestoneStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'EVIDENCE_REVIEW'
  | 'COMPLETED';

export interface PathwayMilestone {
  id: string;
  type: MilestoneType;
  targetId: string;
  status: MilestoneStatus;
  evidenceRequired: number;
}

export interface LearningPathway {
  learnerId: string;
  goal: string;
  milestones: PathwayMilestone[];
  prerequisites: string[];
  estimatedStages: number;
  confidence: number;
}

export interface PathwayScoreInput {
  goalAlignment: number;
  prerequisiteFit: number;
  competencyGap: number;
  evidenceConfidence: number;
  learnerPreferenceFit: number;
  teacherPriority: number;
}

/**
 * Weighted pathway selection algorithm based on engineering parameters.
 */
export function scorePathway(input: PathwayScoreInput): number {
  return (
    input.goalAlignment * 0.25 +
    input.prerequisiteFit * 0.20 +
    input.competencyGap * 0.20 +
    input.evidenceConfidence * 0.15 +
    input.learnerPreferenceFit * 0.10 +
    input.teacherPriority * 0.10
  );
}

/**
 * Valid pathway milestone state transitions.
 * LOCKED -> AVAILABLE -> IN_PROGRESS -> EVIDENCE_REVIEW -> COMPLETED
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  LOCKED: ['AVAILABLE'],
  AVAILABLE: ['IN_PROGRESS'],
  IN_PROGRESS: ['EVIDENCE_REVIEW', 'COMPLETED'],
  EVIDENCE_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
};

export function transition(from: string, to: string): string {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Invalid pathway milestone transition from ${from} to ${to}.`);
  }
  return to;
}
