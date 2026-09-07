export interface KnowledgeGateInput {
  privacyApproved: boolean;
  safetyApproved: boolean;
  evidenceQuality: number;
  replicated: boolean;
  expertReviewed: boolean;
}

export interface CreateKnowledgeDto {
  claimId: string;
  knowledgeType: string;
  statement: string;
  confidence: number;
  evidenceCount: number;
  replicationCount: number;
  scopeJson: Record<string, unknown>;
}

export interface KnowledgeContributionDto {
  tenantId: string;
  claimId: string;
  contributionType: string;
  evidenceCount: number;
  privacyMethod: string;
}
