export interface ResearchRecord {
  anonymousLearnerId: string;
  conceptId: string;
  evidenceType: string;
  outcome: number;
  timestampBucket: string;
}

export interface CreateResearchDatasetDto {
  name: string;
  purpose: string;
  sourceScope: string;
  privacyMethod: string;
  schemaVersion?: string;
}
