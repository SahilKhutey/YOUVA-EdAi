export type PlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED';

export interface PopulationRule {
  cohort?: string;
  gradeLevel?: string;
  subject?: string;
  minMastery?: number;
  maxMastery?: number;
  sampleRatio?: number;
}

export interface BaselineDefinition {
  metric: string;
  population?: PopulationRule;
  windowStart: string | Date;
  windowEnd: string | Date;
  aggregation: 'MEAN' | 'MEDIAN' | 'RATE' | 'PERCENTILE';
  minimumSampleSize: number;
}

export interface GuardrailMetric {
  metric: string;
  acceptableTolerance: number; // e.g. 0.05 for 5% degradation max
  targetDirection: 'INCREASE' | 'DECREASE' | 'STABILIZE';
}

export interface SuccessCriteria {
  primaryMetric: string;
  targetDirection: 'INCREASE' | 'DECREASE' | 'STABILIZE';
  targetValue: number;
  minimumSampleSize: number;
  evaluationWindowDays: number;
  confidenceRequirement?: number;
  guardrailMetrics: GuardrailMetric[];
}

export interface ImprovementPlanDto {
  id: string;
  tenantId: string;
  sourceInsightIds: string[];
  sourceRecommendationIds: string[];
  targetType: string;
  targetId: string;
  objective: string;
  hypothesis: string;
  baseline: BaselineDefinition;
  successCriteria: SuccessCriteria;
  policyVersion: string;
  status: PlanStatus;
  ownerId: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
