/**
 * YOUVA-EdAI — Milestone N23 Types
 * Human Capability Intelligence, Global Learning Mobility & Collective Human Potential
 * Governed by YOUVA-N23-CHARTER-2026
 */

export type CapabilityProgressionLevel =
  | 'FOUNDATIONAL'
  | 'DEVELOPING'
  | 'DEMONSTRATED'
  | 'VALIDATED'
  | 'APPLIED'
  | 'ADVANCED'
  | 'EXPIRED';

export interface CapabilityTranslationMapping {
  mappingId: string;
  sourceInstitution: string;
  sourceCapabilityCode: string;
  sourceCapabilityName: string;
  targetInstitution: string;
  targetCapabilityCode: string;
  targetCapabilityName: string;
  commonOntologyCode: string;
  confidence: number; // 0.0 - 1.0
  reviewStatus: 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'DEPRECATED';
  version: string;
  transferTaskRequired: boolean;
  reviewedBy?: string;
  updatedAt: string;
}

export interface TransferTaskEvaluation {
  taskId: string;
  learnerId: string;
  sourceContext: string;
  targetContext: string;
  demonstratedScore: number; // 0 - 100
  transferValidated: boolean;
  evaluator: string;
  timestamp: string;
}

export interface CapabilityMobilityRequest {
  subjectId: string;
  sourceOrganizationId: string;
  destinationOrganizationId: string;
  requestedCapabilities: string[];
  evidenceScopes: string[];
  purpose: string;
  consentId: string;
  expiresAt?: string;
  correlationId: string;
}

export interface CapabilityMobilityResult {
  mobilityId: string;
  subjectId: string;
  sourceOrganizationId: string;
  destinationOrganizationId: string;
  acceptedEvidence: string[];
  pendingEvidence: string[];
  rejectedEvidence: string[];
  mappingVersion: string;
  consentVerified: boolean;
  auditEventId: string;
  evaluatedAt: string;
}

export interface LearningWalletReference {
  walletId: string;
  learnerId: string;
  capabilityRefs: string[];
  evidenceRefs: string[];
  credentialRefs: string[];
  projectRefs: string[];
  contributionRefs: string[];
  updatedAt: string;
}

export interface CollectiveLearningGroup {
  groupId: string;
  title: string;
  domain: string;
  members: Array<{
    learnerId: string;
    role: 'FACILITATOR' | 'PARTICIPANT' | 'PEER_REVIEWER';
    joinedAt: string;
  }>;
  complementaryCapabilities: string[];
  activeProject?: string;
  createdAt: string;
}

export type ContributionType =
  | 'MENTORING'
  | 'PEER_FEEDBACK'
  | 'PROJECT_CODE'
  | 'OER_TUTORIAL'
  | 'RESEARCH_SUMMARY'
  | 'COMMUNITY_WORK';

export interface KnowledgeContribution {
  contributionId: string;
  authorId: string;
  title: string;
  type: ContributionType;
  artifactUri: string;
  aiAssistanceDisclosed: boolean;
  aiAssistanceDetails?: string;
  validationStatus: 'SUBMITTED' | 'PEER_REVIEWED' | 'VALIDATED' | 'DISPUTED';
  teamAttribution?: Array<{
    contributorId: string;
    role: string;
    contributionSummary: string;
  }>;
  createdAt: string;
}

export type KnowledgeConfidenceStatus =
  | 'SUPPORTED'
  | 'PROBABLE'
  | 'UNCERTAIN'
  | 'DISPUTED'
  | 'OUTDATED';

export interface KnowledgeNode {
  nodeId: string;
  title: string;
  type: 'SKILL' | 'CAPABILITY' | 'RESEARCH' | 'COURSE' | 'PROJECT' | 'ARTIFACT';
  confidenceStatus: KnowledgeConfidenceStatus;
  author: string;
  version: string;
  conflictingNodeIds: string[];
  evidenceUris: string[];
  updatedAt: string;
}

export interface EvidenceResponsiveCurriculum {
  curriculumId: string;
  version: string;
  title: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED';
  changeRationale: string;
  approvedByHumanAuthority?: string;
  historicalLinkedCohorts: string[];
  updatedAt: string;
}

export interface CapabilityTrendSignal {
  trendId: string;
  capabilityName: string;
  sampleSize: number;
  timePeriod: string;
  geographicScope: string;
  confidence: number; // 0.0 - 1.0
  demandDirection: 'INCREASING' | 'STABLE' | 'DECREASING' | 'INSUFFICIENT_DATA';
  sourceInstitutions: string[];
  updatedAt: string;
}

export interface CapabilityValidator {
  validatorId: string;
  organizationId: string;
  validatorType:
    | 'TEACHER'
    | 'INSTITUTION'
    | 'MENTOR'
    | 'ISSUER'
    | 'ASSESSOR'
    | 'SUPERVISOR';
  scopes: string[];
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}

export interface NegativeEvidenceRecord {
  recordId: string;
  interventionType: string;
  observedOutcome: string;
  failureMode:
    | 'INEFFECTIVE_MAPPING'
    | 'DROPOUT_FRICTION'
    | 'MISMATCHED_PREREQUISITE'
    | 'UNEXPECTED_COGNITIVE_OVERLOAD';
  mitigationRecommended: string;
  recordedAt: string;
}

export type KillSwitchSubsystem =
  | 'OPPORTUNITY_NETWORK'
  | 'COMMUNITY_FEATURES'
  | 'EVIDENCE_EXCHANGE'
  | 'EXTERNAL_INTEGRATIONS'
  | 'AI_RECOMMENDATIONS'
  | 'GLOBAL_EMERGENCY';

export interface SafetyKillSwitch {
  subsystem: KillSwitchSubsystem;
  isTripped: boolean;
  trippedBy?: string;
  reason?: string;
  trippedAt?: string;
}
