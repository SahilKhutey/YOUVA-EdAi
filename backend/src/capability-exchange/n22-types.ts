/**
 * YOUVA-EdAI — Milestone N22 Types
 * Global Human Capability Exchange, Lifelong Opportunity Network & Trusted Learning Economy
 * Governed by YOUVA-N22-CHARTER-2026
 */

export type OpportunityType =
  | 'LEARNING'
  | 'PROJECT'
  | 'MENTORSHIP'
  | 'INTERNSHIP'
  | 'APPRENTICESHIP'
  | 'RESEARCH'
  | 'VOLUNTEER'
  | 'FREELANCE'
  | 'EMPLOYMENT'
  | 'ENTREPRENEURSHIP'
  | 'RESKILLING'
  | 'FELLOWSHIP';

export type OpportunityStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_REVIEW'
  | 'PAUSED'
  | 'FILLED'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'FLAGGED';

export type ProficiencyLevel =
  | 'INTRODUCTORY'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export interface CapabilityRequirement {
  capabilityId: string;
  name: string;
  minimumProficiency: ProficiencyLevel;
  requiredEvidenceTypes: string[];
  isMandatory: boolean;
  description?: string;
}

export interface SkillRequirement {
  skillId: string;
  name: string;
  level: number; // 1-5 scale
  isMandatory: boolean;
}

export interface OpportunityLocation {
  type: 'REMOTE' | 'HYBRID' | 'ONSITE';
  city?: string;
  country?: string;
}

export interface OpportunityCompensation {
  type: 'STIPEND' | 'SALARY' | 'UNPAID_VOLUNTEER' | 'BOUNTY' | 'GRANT';
  currency?: string;
  range?: string;
  disclosed: boolean;
}

export interface Opportunity {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  type: OpportunityType;
  status: OpportunityStatus;
  capabilityRequirements: CapabilityRequirement[];
  skillRequirements: SkillRequirement[];
  location: OpportunityLocation;
  compensation?: OpportunityCompensation;
  isMinorEligible: boolean;
  requiresParentalConsent: boolean;
  isSponsored: boolean;
  freshnessScore: number; // 0.0 - 1.0
  version: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface CapabilityAlignmentResult {
  opportunityId: string;
  learnerId: string;
  demonstratedRequirements: string[];
  evidenceGaps: string[];
  recommendedPreparation: string[];
  alignmentPercentage: number; // 0-100 purely based on matched requirements
  consequentialPredictionProhibited: boolean; // Must be true (Invariant)
  matchingExplanation: string;
  evaluatedAt: string;
}

export interface PassportCapability {
  capabilityId: string;
  name: string;
  proficiency: ProficiencyLevel;
  evidenceIds: string[];
  validatedAt: string;
  issuer: string;
}

export interface PassportExperience {
  experienceId: string;
  title: string;
  organization: string;
  type: OpportunityType;
  duration: string;
  verified: boolean;
  evidenceIds: string[];
}

export interface SelectiveDisclosureToken {
  token: string;
  recipientId: string;
  purpose: string;
  disclosedCapabilityIds: string[];
  expiresAt: string;
  revoked: boolean;
}

export interface HumanCapabilityPassport {
  passportId: string;
  learnerId: string;
  ownerPublicKey: string;
  disclosedSections: string[];
  capabilities: PassportCapability[];
  experiences: PassportExperience[];
  activeDisclosures: SelectiveDisclosureToken[];
  updatedAt: string;
}

export interface ExperienceEvidence {
  id: string;
  learnerId: string;
  experienceId: string;
  artifactUri: string;
  aiAssistanceDisclosed: boolean;
  aiAssistanceDetails?: string;
  validationStatus: 'PENDING' | 'VALIDATED' | 'DISPUTED' | 'REJECTED';
  validatorAuthority: string;
  submittedAt: string;
}

export type ProhibitedAgentActionType =
  | 'BIND_CONTRACT'
  | 'NEGOTIATE_SALARY'
  | 'AUTO_SUBMIT'
  | 'REJECT_APPLICANT'
  | 'MAKE_ADMISSION_DECISION';

export type AllowedAgentActionType =
  | 'RECOMMEND_OPPORTUNITY'
  | 'DRAFT_APPLICATION'
  | 'CHECK_ALIGNMENT'
  | 'FLAG_ANOMALY';

export type AgentActionType = AllowedAgentActionType | ProhibitedAgentActionType;

export interface OpportunityAgentAction {
  actionId: string;
  agentId: string;
  learnerId: string;
  actionType: AgentActionType;
  authorizedByLearner: boolean;
  authorizationToken: string;
  payload: Record<string, any>;
  status: 'PENDING_CONFIRMATION' | 'EXECUTED' | 'REJECTED' | 'REVOKED';
  timestamp: string;
}

export interface CapabilityExchangeRequest {
  requestId: string;
  learnerId: string;
  opportunityId: string;
  disclosureToken: string;
  consentAcknowledged: boolean;
  requestedAt: string;
}

export interface CapabilityExchangeResult {
  exchangeId: string;
  requestId: string;
  learnerId: string;
  opportunityId: string;
  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'INTERVIEW_OFFERED'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'WITHDRAWN';
  auditTrail: Array<{ event: string; timestamp: string; actor: string }>;
  updatedAt: string;
}

export interface OpportunityTrustSignal {
  providerId: string;
  verificationLevel:
    | 'UNVERIFIED'
    | 'COMMUNITY_VERIFIED'
    | 'INSTITUTION_ATTESTED'
    | 'ENTERPRISE_AUDITED';
  complaintRate: number; // 0.0 - 1.0
  payTransparencyScore: number; // 0.0 - 1.0
  freshnessAvgDays: number;
  isSuspended: boolean;
}

export interface OpportunityFraudReport {
  reportId: string;
  opportunityId: string;
  reporterId: string;
  anomalyType:
    | 'UNPAID_DECEPTIVE'
    | 'BAIT_AND_SWITCH'
    | 'UNAUTHORIZED_DATA_COLLECTION'
    | 'AI_FABRICATION'
    | 'EXPLOITATIVE_CONDITIONS';
  description: string;
  status: 'PENDING_REVIEW' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'DISMISSED';
  reportedAt: string;
  resolutionNotes?: string;
}
