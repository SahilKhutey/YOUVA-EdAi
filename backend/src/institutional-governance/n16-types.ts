/**
 * YOUVA-EdAI — Milestone N16 Types & Domain Models
 * Institutional & Market Scale, Global Expansion & Continuous Governance
 * Clauses N16.0 – N16.171
 */

export type JurisdictionStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';

export interface JurisdictionProfile {
  jurisdictionId: string; // e.g. 'IN-DL', 'US-CA', 'EU-DE', 'UK-ENG'
  name: string;
  privacyPolicyVersion: string;
  childSafetyPolicyVersion: string;
  dataResidencyRules: string[];
  retentionRules: string[];
  educationRequirements: string[];
  credentialRules: string[];
  approvedAiProviders: string[];
  sovereignDataCenterRegion: string;
  status: JurisdictionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JurisdictionActivationStep {
  stepNumber: number;
  stepName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  evidenceUrl?: string;
  notes?: string;
  reviewerId?: string;
  completedAt?: string;
}

export interface JurisdictionActivationRecord {
  jurisdictionId: string;
  currentStep: number;
  steps: JurisdictionActivationStep[];
  overallStatus: 'PENDING' | 'READY_FOR_PILOT' | 'ACTIVATED' | 'BLOCKED';
  updatedAt: string;
}

export type EnterpriseRole =
  | 'PLATFORM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'ACADEMIC_ADMIN'
  | 'TEACHER'
  | 'REVIEWER'
  | 'SAFETY_REVIEWER'
  | 'PARENT_GUARDIAN'
  | 'LEARNER'
  | 'CREDENTIAL_ISSUER'
  | 'CREDENTIAL_VERIFIER'
  | 'SUPPORT_OPERATOR'
  | 'AUDITOR';

export interface InstitutionalTenantScope {
  platformId: string;
  organizationId: string;
  institutionId: string;
  campusId?: string;
  departmentId?: string;
  classId?: string;
}

export interface InstitutionalPolicy {
  policyId: string;
  scopeLevel: 'PLATFORM' | 'JURISDICTION' | 'ORGANIZATION' | 'INSTITUTION' | 'CLASS';
  targetId: string;
  aiUsageRules: {
    maxAutonomyClass: string;
    allowedTools: string[];
    reauthorizationDays: number;
  };
  childSafetyRules: {
    enforceChildSafety: boolean;
    autoEscalationSeconds: number;
  };
  contentRules: {
    requireSmeReview: boolean;
    allowGenerativeAssets: boolean;
  };
  assessmentRules: {
    lockSummativeDuringExam: boolean;
    proctoringLevel: 'NONE' | 'BROWSER_LOCK' | 'AUDIO_VISUAL';
  };
  dataRetentionRules: {
    learnerDataMonths: number;
    auditLogYears: number;
  };
  freezeActive: boolean;
  freezeReason?: string;
  freezeWindow?: { start: string; end: string };
  version: string;
  updatedAt: string;
}

export interface EffectivePolicy {
  resolvedScope: InstitutionalTenantScope;
  maxAutonomyClass: string;
  allowedTools: string[];
  enforceChildSafety: boolean;
  autoEscalationSeconds: number;
  requireSmeReview: boolean;
  allowGenerativeAssets: boolean;
  lockSummativeDuringExam: boolean;
  proctoringLevel: string;
  learnerDataMonths: number;
  auditLogYears: number;
  freezeActive: boolean;
  freezeReason?: string;
  inheritanceChain: string[];
}

export interface CurriculumStandard {
  standardId: string;
  name: string;
  authority: string; // e.g. 'NCERT', 'CAMBRIDGE', 'IB', 'COMMON_CORE'
  jurisdictionId: string;
  version: string;
}

export interface CurriculumMapping {
  mappingId: string;
  youvaConceptId: string;
  standardId: string;
  externalStandardCode: string;
  learningObjective: string;
  competencyTier: number;
  evidenceCriteria: string[];
  status: 'DRAFT' | 'VERIFIED' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
}

export interface ExternalEvidencePayload {
  evidenceId: string;
  externalSystemId: string;
  sourceSystemType: 'CANVAS_LMS' | 'BLACKBOARD' | 'POWERSCHOOL' | 'GOOGLE_CLASSROOM' | 'CUSTOM_ADAPTER';
  learnerExternalId: string;
  tenantId: string;
  youvaConceptId: string;
  rawScore: number;
  maxScore: number;
  artifactHash: string;
  timestamp: string;
}

export interface EvidenceValidationResult {
  evidenceId: string;
  isValid: boolean;
  status: 'ACCEPTED_FOR_EVALUATION' | 'REJECTED';
  confidenceScore: number;
  reason?: string;
  learningEngineApplied: boolean;
  appliedMasteryDelta?: number;
  evaluatedAt: string;
}

export interface CredentialAttestation {
  credentialId: string;
  learnerId: string;
  issuerId: string;
  skillCode: string;
  competencyLevel: string;
  evidenceHashes: string[];
  issuedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  cryptographicSignature: string;
}

export interface SelectiveDisclosureRequest {
  verifierId: string;
  credentialId: string;
  requestedFields: Array<'SKILL_CODE' | 'COMPETENCY_LEVEL' | 'ISSUER_IDENTITY' | 'VALIDITY_STATUS' | 'ISSUANCE_DATE'>;
  purpose: string;
}

export interface SelectiveDisclosureResponse {
  credentialId: string;
  verified: boolean;
  disclosedFields: Record<string, any>;
  proofHash: string;
  verificationTimestamp: string;
}

export type EvidenceLevel =
  | 'IMPLEMENTED'
  | 'TESTED'
  | 'VERIFIED'
  | 'INDEPENDENTLY_VERIFIED'
  | 'PILOT_VALIDATED';

export interface ProductClaim {
  claimId: string;
  statement: string;
  category: 'SECURITY' | 'SAFETY' | 'PRIVACY' | 'PEDAGOGICAL' | 'OPERATIONAL' | 'CREDENTIAL';
  evidenceIds: string[];
  evidenceLevel: EvidenceLevel;
  owner: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  status: 'CURRENT' | 'STALE' | 'DOWNGRADED';
}

export type TrustCategory =
  | 'SECURITY'
  | 'PRIVACY'
  | 'AI_GOVERNANCE'
  | 'SAFETY'
  | 'AVAILABILITY'
  | 'SUBPROCESSORS'
  | 'COMPLIANCE'
  | 'INDEPENDENT_ASSESSMENTS';

export interface TrustArtifact {
  artifactId: string;
  category: TrustCategory;
  title: string;
  description: string;
  verificationStatus: 'VERIFIED' | 'UNDER_REVIEW';
  auditFirm?: string;
  evidenceUrl: string;
  lastAuditedAt: string;
}

export interface SubprocessorRecord {
  subprocessorId: string;
  name: string;
  purpose: string;
  dataScope: string[];
  sovereignJurisdictions: string[];
  securityCertification: string;
  fallbackAvailable: boolean;
}

export interface AgentAutonomyLease {
  leaseId: string;
  agentId: string;
  tenantId: string;
  authorizedClass: string;
  grantedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  reauthorizationEvidenceIds: string[];
}

export interface GovernanceDebtRecord {
  debtId: string;
  category: 'POLICY' | 'MODEL' | 'CLAIM' | 'DOCUMENTATION' | 'INTEGRATION' | 'JURISDICTION';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  daysStale: number;
  remediationStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export type InstitutionalRiskCategory =
  | 'EDUCATIONAL'
  | 'SAFETY'
  | 'AI'
  | 'SECURITY'
  | 'PRIVACY'
  | 'LEGAL'
  | 'OPERATIONAL'
  | 'FINANCIAL'
  | 'MARKET'
  | 'REPUTATIONAL'
  | 'THIRD_PARTY';

export interface InstitutionalRiskRecord {
  riskId: string;
  category: InstitutionalRiskCategory;
  riskDescription: string;
  probability: number; // 1 - 5
  impact: number;      // 1 - 5
  riskScore: number;   // probability * impact
  owner: string;
  mitigationPlan: string;
  residualRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  explicitSignoffBy: string;
  reviewDate: string;
}

export interface ExecutiveAnalytics {
  tenantId: string;
  period: string;
  learningMasteryGrowth: number;       // e.g. +14.2%
  retentionRate: number;               // e.g. 96.8%
  teacherInterventionCount: number;
  teacherWorkloadReductionHours: number;
  safetyIncidentCount: number;
  avgSafetyResponseSeconds: number;
  uptimePercentage: number;
  aiCostPerValidatedOutcome: number;   // e.g. $0.042
  credentialsIssued: number;
  credentialsVerified: number;
}

export type InstitutionalAcceptanceState =
  | 'INSTITUTIONALLY_VALIDATED'
  | 'RESTRICTED_EXPANSION'
  | 'EXPANSION_SUSPENDED';

export interface InstitutionalAcceptanceMatrix {
  evaluationDate: string;
  overallState: InstitutionalAcceptanceState;
  domainScores: Record<string, { pass: boolean; score: number; notes: string }>;
  certificationRef: string;
}
