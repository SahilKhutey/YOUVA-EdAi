/**
 * YOUVA-EdAI — Milestone N21 Types
 * Global Learning & Human Capability Ecosystem Intelligence
 * Governed by YOUVA-N21-CHARTER-2026
 */

export type EcosystemNodeType =
  | 'LEARNER'
  | 'TEACHER'
  | 'INSTITUTION'
  | 'PROGRAM'
  | 'COURSE'
  | 'SKILL'
  | 'CAPABILITY'
  | 'EVIDENCE'
  | 'CREDENTIAL'
  | 'ISSUER'
  | 'MENTOR'
  | 'OPPORTUNITY'
  | 'RESEARCH_STUDY'
  | 'OUTCOME';

export interface EcosystemNode {
  id: string;
  type: EcosystemNodeType;
  label: string;
  organizationId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export type EdgeRelationshipType =
  | 'ENROLLED_IN'
  | 'DEMONSTRATED'
  | 'POSSESSES'
  | 'VALIDATES'
  | 'ISSUES'
  | 'ATTESTS'
  | 'REQUIRES'
  | 'EVALUATES'
  | 'COLLABORATES_WITH';

export type EdgeStatus =
  | 'SUPPORTED'
  | 'PROBABLE'
  | 'CANDIDATE'
  | 'DISPUTED'
  | 'UNCERTAIN'
  | 'STALE';

export interface EcosystemEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: EdgeRelationshipType;
  authority: string;
  confidence: number; // 0.0 - 1.0
  scope: string;      // e.g. "INSTITUTION:DPS-RKP", "GLOBAL"
  status: EdgeStatus;
  version: number;
  timestamp: string;
}

export type PartnerType =
  | 'INSTITUTION'
  | 'ISSUER'
  | 'MENTOR'
  | 'RESEARCHER'
  | 'OPPORTUNITY_PROVIDER'
  | 'VERIFIER'
  | 'EMPLOYER';

export type PartnerStatus =
  | 'APPLIED'
  | 'VERIFIED'
  | 'ONBOARDED'
  | 'ACTIVE'
  | 'REVIEW'
  | 'SUSPENDED'
  | 'OFFBOARDED';

export type PartnerScope =
  | 'READ_SHARED_EVIDENCE'
  | 'SUBMIT_EVIDENCE'
  | 'VERIFY_CREDENTIAL'
  | 'PUBLISH_OPPORTUNITY'
  | 'ACCESS_AGGREGATE_ANALYTICS';

export interface EcosystemPartner {
  partnerId: string;
  organizationId: string;
  name: string;
  partnerType: PartnerType;
  status: PartnerStatus;
  scopes: PartnerScope[];
  apiKeyHash: string;
  registeredAt: string;
  updatedAt: string;
}

export interface EcosystemEvent {
  eventId: string;
  eventType: string;
  sourceOrganizationId: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  correlationId: string;
  version: number;
  payload: Record<string, any>;
  idempotencyKey: string;
}

export interface AuthorityMatrixRecord {
  domainField: string;
  authoritativeSystem: 'YOUVA' | 'ISSUER' | 'INSTITUTION' | 'EMPLOYER';
  allowExternalMutation: boolean;
  conflictStrategy: 'REJECT' | 'LOG_CONFLICT' | 'QUARANTINE';
}

export interface CurriculumObjectiveMapping {
  curriculumId: string;
  objectiveText: string;
  mappedSkillId: string;
  mappedCapabilityId: string;
  confidence: number; // 0.0 - 1.0
  qualitativeGapNote: string;
  evaluatedAt: string;
}

export interface FederatedCohortMetric {
  metricName: string;
  sampleSize: number;
  aggregatedValue: number | string;
  privacyProtected: boolean;
  noiseAdded: boolean;
  isSuppressed: boolean; // True if sampleSize < privacy threshold (n < 10)
  suppressionReason?: string;
}

export interface EcosystemHealthIndex {
  evidenceQuality: number;       // 0-100
  credentialTrust: number;       // 0-100
  interoperability: number;      // 0-100
  privacyCompliance: number;     // 0-100
  teacherWorkloadIndex: number;  // 0-100
  learnerAgencyScore: number;    // 0-100
  compositeScore: number;        // 0-100 (multidimensional average, not human potential)
  evaluatedAt: string;
}
