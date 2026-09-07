export interface EvidenceQuality {
  independence: number;
  consistency: number;
  completeness: number;
  provenance: number;
  outcomeStrength: number;
}

export interface ClaimVerification {
  claimId: string;
  sampleSize: number;
  evidenceQuality: number;
  replicationCount: number;
  independentSources: number;
  safetyPassed: boolean;
  privacyPassed: boolean;
  reviewerApproved: boolean;
}

export interface CreateClaimDto {
  claimType:
    | 'CONTENT_EFFECTIVENESS'
    | 'INTERVENTION_EFFECTIVENESS'
    | 'MODEL_EFFECTIVENESS'
    | 'CURRICULUM_ALIGNMENT'
    | 'LEARNING_PATTERN';
  statement: string;
  scopeJson: Record<string, unknown>;
  evidenceIds?: string[];
}
