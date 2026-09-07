export enum InterventionTier {
  NORMAL = 'NORMAL',
  TIER_1_AI_SUPPORT = 'TIER_1_AI_SUPPORT',
  TIER_2_TEACHER_REVIEW = 'TIER_2_TEACHER_REVIEW',
  TIER_3_TEACHER_URGENT = 'TIER_3_TEACHER_URGENT',
}

export interface InterventionMetrics {
  consecutiveFailures: number;
  struggleDurationMinutes: number;
  dropInAccuracy: number; // 0.0 to 1.0
  sentimentScore: number;  // 0.0 (very frustrated) to 1.0 (positive/confident)
}

export interface InterventionEvaluation {
  score: number;
  tier: InterventionTier;
  recommendedAction: string;
  rationale: string;
  evaluatedAt: string;
}

export interface ModelMetrics {
  correctness: number;
  safety: number;
  helpfulness: number;
  ageAppropriateness?: number;
}

export interface DriftReport {
  healthy: boolean;
  criticalViolation: boolean;
  drift: Record<string, number>;
  recommendation: 'NORMAL_OPERATION' | 'FLAG_FOR_MONITORING' | 'TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION';
  timestamp: string;
}

export type BudgetState = 'OK' | 'WARNING' | 'EXCEEDED';

export interface BudgetReport {
  tenantId: string;
  totalSpent: number;
  budgetLimit: number;
  percentUsed: number;
  state: BudgetState;
}
