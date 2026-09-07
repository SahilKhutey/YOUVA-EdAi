export interface LearningPolicyContext {
  tenantId: string;
  learnerId: string;
  ageTier: string;
  region: string;
  consent: Record<string, boolean>;
  action: string;
  experimentId?: string;
  modelVersion?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresHumanApproval: boolean;
  reasonCode: string;
  policyVersion: string;
}

export interface FairnessMetric {
  group: string;
  sampleSize: number;
  outcomeRate: number;
  errorRate: number;
  confidence?: number;
}
