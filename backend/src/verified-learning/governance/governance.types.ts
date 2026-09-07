export interface GovernanceDecisionDto {
  resourceType: string;
  resourceId: string;
  decision: 'ACCEPT' | 'REJECT' | 'REQUEST_MORE_EVIDENCE' | 'LIMIT_SCOPE';
  reason: string;
  reviewerId: string;
  policyVersion: string;
}

export interface LearningProof {
  learnerId: string;
  conceptId: string;
  evidence: {
    ids: string[];
    count: number;
    confidence: number;
  };
  intervention?: {
    id: string;
    type: string;
  };
  outcome?: {
    baseline: number;
    final: number;
    effect?: number;
  };
  provenance: {
    modelVersion?: string;
    policyVersion: string;
    contentVersion?: string;
  };
  teacherReview?: {
    reviewed: boolean;
    reviewerId?: string;
  };
}
