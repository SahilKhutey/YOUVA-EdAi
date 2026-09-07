export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  APPROVED = 'APPROVED',
  CANARY = 'CANARY',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ROLLED_BACK = 'ROLLED_BACK',
  RETIRED = 'RETIRED',
}

export interface ReleaseValidation {
  unitTestsPassed: boolean;
  integrationTestsPassed: boolean;
  securityTestsPassed: boolean;
  safetyTestsPassed: boolean;
  regressionTestsPassed: boolean;
  performancePassed: boolean;
}

export interface CreateReleaseArtifactDto {
  artifactType: string; // 'AI_MODEL' | 'PROMPT' | 'CONTENT' | 'CURRICULUM' | 'POLICY' | 'WORKFLOW'
  artifactKey: string;
  version: string;
  riskLevel: string;
  checksum: string;
  validationJson?: string;
}

export interface ShadowComparison {
  requestId: string;
  productionDecision: string;
  candidateDecision: string;
  agreement: boolean;
  productionScore?: number;
  candidateScore?: number;
  safetyDifference: boolean;
}
