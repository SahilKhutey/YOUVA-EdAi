/**
 * YOUVA-EdAI — Milestone N19 Domain Types & Invariants
 * Global Skills, Evidence & Credential Network
 * Clauses N19.0 – N19.211
 */

export type SkillStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';

export interface Skill {
  skillId: string;
  canonicalName: string;
  description: string;
  parentSkillId?: string;
  level?: string;               // e.g. 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY'
  domain?: string;              // e.g. 'Mathematics', 'Computer Science', 'Physics'
  prerequisites?: string[];     // skillIds required prior to this skill
  evidenceRequirements: string[]; // Descriptions or criteria rules
  status: SkillStatus;
  version: string;              // e.g. '1.0.0'
  reviewDate?: string;
  changeHistory?: {
    version: string;
    changedAt: string;
    description: string;
  }[];
}

export type EquivalenceLevel =
  | 'STRONG_MATCH'      // >= 90% alignment
  | 'PARTIAL_MATCH'     // 60% - 89% alignment
  | 'RELATED'           // 30% - 59% alignment
  | 'NO_MATCH'          // < 30% alignment
  | 'REQUIRES_REVIEW';  // Ambiguous mapping requiring human SME review

export interface SkillEquivalenceResult {
  sourceSkillId: string;
  targetSkillId: string;
  sourceTaxonomy: string;
  targetTaxonomy: string;
  equivalenceLevel: EquivalenceLevel;
  confidenceScore: number;       // 0.00 to 1.00
  mappingRationale: string;
}

export type SkillEvidenceType =
  | 'PROJECT'
  | 'PERFORMANCE'
  | 'PORTFOLIO_ARTIFACT'
  | 'TEACHER_EVALUATION'
  | 'SIMULATION'
  | 'TRANSFER_TASK'
  | 'RETENTION_ASSESSMENT'
  | 'WORK_PRODUCT';

export type EvidenceValidityStatus =
  | 'VALID'
  | 'PROVISIONAL'
  | 'SUPERSEDED'
  | 'INVALIDATED';

export interface EvidenceQualityMetadata {
  validityScore: number;         // 0.00 to 1.00
  recencyHalfLifeDays: number;   // e.g. 180
  independenceRating: number;    // 0.00 to 1.00 (how unassisted was the work)
  assessmentRigorIndex: number;  // 0.00 to 1.00
  issuerTrustScore: number;      // 0.00 to 1.00
}

export interface AiAssistanceDisclosure {
  aiAssisted: boolean;
  assistanceType?:
    | 'DRAFTING'
    | 'CODE_COMPLETION'
    | 'DEBUGGING_HINTS'
    | 'EXPLANATION_SUMMARY'
    | 'NONE';
  contributionPercentage?: number; // 0 to 100
  aiModelVersion?: string;
}

export interface SkillEvidence {
  evidenceId: string;
  learnerId: string;
  skillId: string;
  evidenceType: SkillEvidenceType;
  sourceId: string;
  issuerId?: string;
  achievedAt: string;
  assessmentMethod?: string;
  score?: number;                // 0 - 100
  level?: string;
  validityStatus: EvidenceValidityStatus;
  evidenceVersion: string;
  qualityMetadata: EvidenceQualityMetadata;
  aiAssistanceDisclosure?: AiAssistanceDisclosure;
  provenanceHash: string;
}

export interface EvidenceLineageRecord {
  lineageId: string;
  learnerId: string;
  skillId: string;
  activityId: string;
  attemptId: string;
  assessmentId: string;
  resultScore: number;
  evidenceId: string;
  timestamp: string;
}

export type CredentialLifecycleStatus =
  | 'DRAFT'
  | 'ELIGIBLE'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'SUPERSEDED';

export type CredentialType =
  | 'MICRO_CREDENTIAL'
  | 'CERTIFICATE'
  | 'BADGE'
  | 'DIPLOMA_SPECIALIZATION'
  | 'PROFESSIONAL_LICENSE';

export interface Credential {
  credentialId: string;
  holderId: string;
  issuerId: string;
  credentialType: CredentialType;
  skills: string[];              // Associated skillIds
  evidenceReferences: string[];  // Associated evidenceIds
  issuedAt: string;
  validFrom?: string;
  expiresAt?: string;
  status: CredentialLifecycleStatus;
  policyVersion: string;
  credentialVersion: string;
  revocationReason?:
    | 'ISSUER_CORRECTION'
    | 'FRAUD'
    | 'ELIGIBILITY_CHANGE'
    | 'ASSESSMENT_INVALIDATION'
    | 'POLICY_VIOLATION';
  revokedAt?: string;
  cryptographicProof?: {
    signature: string;
    publicKeyId: string;
    algorithm: string;
  };
}

export type IssuerTrustStatus =
  | 'RECOGNIZED'
  | 'PARTNER'
  | 'SELF_ASSERTED'
  | 'UNVERIFIED'
  | 'SUSPENDED';

export interface CredentialIssuer {
  issuerId: string;
  organizationName: string;
  trustStatus: IssuerTrustStatus;
  authorizedCredentialTypes: CredentialType[];
  publicKey: string;
  keyRotationDate: string;
  status: 'ACTIVE' | 'SUSPENDED';
  tenantId: string;
}

export interface CredentialVerificationResult {
  valid: boolean;
  credentialId: string;
  issuerId: string;
  issuerStatus: string;
  credentialStatus: string;
  issuedAt: string;
  expiresAt?: string;
  skills: {
    skillId: string;
    name: string;
    status: string;
  }[];
  verificationMethod: string;
  verifiedAt: string;
  errorReason?: string;
}

export interface SelectiveDisclosureRequest {
  shareId: string;
  learnerId: string;
  credentialId: string;
  recipientAudience: string;
  purpose: string;
  expiresAt: string;
  discloseScores: boolean;
  discloseEvidenceLineage: boolean;
}

export interface SelectiveDisclosurePresentation {
  shareToken: string;
  credentialId: string;
  skills: string[];
  issuerName: string;
  issuedAt: string;
  expiresAt: string;
  sanitizedProof: string;
}

export interface SkillsPassport {
  learnerId: string;
  skills: {
    skillId: string;
    canonicalName: string;
    verifiedAt: string;
    level: string;
  }[];
  credentials: Credential[];
  evidenceSummary: {
    totalCount: number;
    projectCount: number;
    assessmentCount: number;
  };
  verificationCount: number;
  lastUpdated: string;
}

export interface CredentialInflationSignal {
  issuerId: string;
  abnormalPassRate: number;       // e.g. 0.99
  rapidIssuanceVelocity: number;  // credentials per hour
  minimalEvidenceRatio: number;   // ratio of credentials with <= 1 evidence item
  riskScore: number;              // 0 to 100
  flaggedForReview: boolean;
  detectedAt: string;
}

export interface CredentialEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  version: number;
  payload: unknown;
}
