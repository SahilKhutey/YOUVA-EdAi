export type EvidenceQualityLevel = 1 | 2 | 3 | 4 | 5;

export type LearningEvidenceType =
  | 'PRACTICE'
  | 'ASSESSMENT'
  | 'PROJECT'
  | 'PERFORMANCE'
  | 'PORTFOLIO'
  | 'TEACHER_REVIEW'
  | 'TRANSFER_TASK';

export interface LearningEvidence {
  evidenceId: string;
  learnerId: string;
  tenantId: string;
  skillId: string;
  evidenceType: LearningEvidenceType;
  qualityLevel: EvidenceQualityLevel;
  score?: number; // 0.0 - 1.0
  rubricVersion?: string;
  sourceActivityId?: string;
  verifiedBy?: string; // 'SYSTEM' | teacherId | reviewerId
  createdAt: string;
  metadata?: Record<string, any>;
  authenticityScore?: number; // 0.0 - 1.0
  isRetracted?: boolean;
}

export interface SkillDefinition {
  skillId: string;
  name: string;
  description: string;
  domain: string;
  level: string; // 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED' | 'CAPSTONE'
  prerequisites: string[];
  assessmentCriteria: string[];
  version: string;
}

export interface CredentialPolicy {
  credentialId: string;
  title: string;
  description: string;
  domain: string;
  requiredSkills: string[];
  minimumMastery: number; // e.g. 0.80
  minimumEvidenceCount: number; // e.g. 3
  requiredEvidenceTypes: LearningEvidenceType[];
  minimumQualityLevel: EvidenceQualityLevel;
  teacherApprovalRequired: boolean;
  policyVersion: string;
  validityDays?: number;
}

export type CredentialStatus =
  | 'DRAFT'
  | 'ELIGIBLE'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'EXPIRED';

export type RevocationReason =
  | 'ADMINISTRATIVE_ERROR'
  | 'FRAUD'
  | 'INVALID_EVIDENCE'
  | 'POLICY_VIOLATION'
  | 'CREDENTIAL_SUPERSEDED'
  | 'ISSUER_CORRECTION';

export interface RevocationRecord {
  revokedAt: string;
  revokedBy: string;
  reason: RevocationReason;
  notes?: string;
}

export interface CredentialRecord {
  credentialId: string;
  policyId: string;
  policyVersion: string;
  learnerId: string;
  tenantId: string;
  status: CredentialStatus;
  issuedAt?: string;
  expiresAt?: string;
  evidenceIds: string[];
  authorizedBy?: string;
  authorizedAt?: string;
  cryptographicProof?: CredentialProof;
  revocation?: RevocationRecord;
  clientRequestId?: string; // Idempotency key
  createdAt: string;
  updatedAt: string;
}

export interface CredentialProof {
  type: string; // 'Ed25519Signature2020' | 'HmacSha256Signature2026'
  created: string;
  verificationMethod: string; // Key URI e.g. did:youva:issuer:delhi-01#key-1
  proofPurpose: 'assertionMethod';
  proofValue: string;
  keyId: string;
}

export interface OpenBadgeAssertion {
  '@context': string;
  id: string;
  type: 'Assertion';
  recipient: {
    type: 'email' | 'id';
    hashed: boolean;
    identity: string;
    salt?: string;
  };
  badge: {
    id: string;
    type: 'BadgeClass';
    name: string;
    description: string;
    image: string;
    criteria: { narrative: string };
    issuer: {
      id: string;
      type: 'Issuer';
      name: string;
      url: string;
    };
    alignment: Array<{
      targetName: string;
      targetUrl: string;
      targetDescription?: string;
    }>;
  };
  issuedOn: string;
  expires?: string;
  evidence: Array<{
    id: string;
    type: string;
    narrative?: string;
  }>;
  verification: {
    type: 'hosted' | 'signed';
    verificationProperty?: string;
  };
}

export interface W3CVerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string; // did:youva:learner:<id>
    skills: Array<{
      id: string;
      name: string;
      domain: string;
      level: string;
    }>;
    achievement: {
      id: string;
      title: string;
      description: string;
    };
  };
  evidence: Array<{
    id: string;
    type: string[];
    evidenceType: string;
    qualityLevel: number;
  }>;
  proof: CredentialProof;
}

export interface PortfolioArtifact {
  artifactId: string;
  learnerId: string;
  tenantId: string;
  title: string;
  description: string;
  skills: string[];
  evidenceIds: string[];
  visibility: 'PRIVATE' | 'SHARED';
  version: string;
  shareToken?: string;
  shareExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAssistanceDisclosure {
  brainstormingPct: number; // 0 - 100
  codeGenerationPct: number; // 0 - 100
  editingPct: number; // 0 - 100
  researchPct: number; // 0 - 100
  humanContributions: {
    problemDefinition: boolean;
    architecturalDecisions: boolean;
    testingAndVerification: boolean;
    personalReflection: boolean;
  };
  toolsUsed: string[];
  studentStatement: string;
}

export interface HighSchoolProjectSubmission {
  projectId: string;
  learnerId: string;
  tenantId: string;
  title: string;
  domain: string;
  problemStatement: string;
  artifactUrl: string;
  repositoryUrl?: string;
  aiDisclosure: AIAssistanceDisclosure;
  authenticityScore: number; // 0.0 - 1.0
  submittedAt: string;
  rubricEvaluation?: RubricEvaluation;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'EVALUATED' | 'REJECTED';
}

export type RubricTier = 'BEGINNING' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED';

export interface RubricCriterionScore {
  criterionId: string;
  tier: RubricTier;
  points: number; // 1 - 4
  feedback: string;
}

export interface RubricEvaluation {
  evaluationId: string;
  projectId: string;
  learnerId: string;
  evaluatorId: string; // Teacher or SME
  isAiAssistedSuggestion: boolean;
  rubricVersion: string;
  criteriaScores: RubricCriterionScore[];
  totalScore: number;
  maxScore: number;
  overallComments: string;
  evaluatedAt: string;
}

export interface SkillsPassportItem {
  skillId: string;
  name: string;
  domain: string;
  level: string;
  masteryScore: number;
  evidenceCount: number;
  qualityLevelMax: EvidenceQualityLevel;
  demonstratedAt: string;
  credentialIds: string[];
}

export interface SkillsPassport {
  learnerId: string;
  tenantId: string;
  generatedAt: string;
  version: string;
  totalSkillsDemonstrated: number;
  totalEvidenceItems: number;
  totalCredentialsIssued: number;
  skills: SkillsPassportItem[];
  credentials: Array<{
    credentialId: string;
    title: string;
    issuedAt: string;
    status: CredentialStatus;
    policyId: string;
  }>;
}

export interface PublicVerificationResponse {
  valid: boolean;
  status: CredentialStatus;
  credentialId: string;
  title: string;
  domain: string;
  issuer: {
    id: string;
    name: string;
  };
  issuedAt?: string;
  expiresAt?: string;
  evidenceCount: number;
  revocationNotice?: {
    revokedAt: string;
    reason: RevocationReason;
  };
  verificationMethod: string;
}

export interface CredentialEvent {
  eventId: string;
  eventType:
    | 'CREDENTIAL_ELIGIBLE'
    | 'CREDENTIAL_APPROVED'
    | 'CREDENTIAL_ISSUED'
    | 'CREDENTIAL_SUSPENDED'
    | 'CREDENTIAL_REVOKED';
  credentialId: string;
  learnerId: string;
  tenantId: string;
  correlationId: string;
  occurredAt: string;
  version: number;
  payload: Record<string, any>;
}

export interface CareerSkillMapping {
  careerId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  recommendedProjects: string[];
  overlapPercentage: number;
  skillGaps: string[];
}
