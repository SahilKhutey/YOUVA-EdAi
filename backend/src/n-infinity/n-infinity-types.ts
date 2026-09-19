/**
 * YOUVA-EdAI — Milestone N∞ Types
 * Continuous Human Learning & Capability Civilization Infrastructure
 * Governed by YOUVA-N-INFINITY-CONSTITUTION-2026
 */

export type MasterLoopStage =
  | 'OBSERVE'
  | 'UNDERSTAND'
  | 'LEARN'
  | 'PRACTICE'
  | 'DEMONSTRATE'
  | 'ASSESS'
  | 'VALIDATE'
  | 'BUILD_CAPABILITY'
  | 'TRANSFER'
  | 'APPLY'
  | 'CREATE'
  | 'CONTRIBUTE'
  | 'TEACH'
  | 'REFLECT'
  | 'MEASURE'
  | 'VERIFY'
  | 'IMPROVE'
  | 'REVALIDATE';

export interface MasterLoopState {
  executionId: string;
  learnerId: string;
  currentStage: MasterLoopStage;
  completedStages: MasterLoopStage[];
  artifacts: Array<{ stage: MasterLoopStage; uri: string; timestamp: string }>;
  loopIteration: number;
  updatedAt: string;
}

export interface OperatingScorecard {
  scorecardId: string;
  learningScore: number; // 0-100: retention, transfer, metacognition
  capabilityScore: number; // 0-100: empirical demonstration, task execution
  trustScore: number; // 0-100: evidence verification, portability
  safetyScore: number; // 0-100: zero incidents, minor safeguards
  sustainabilityScore: number; // 0-100: operational resilience, ethical alignment
  compositeHealthIndex: number; // 0-100: multi-dimensional balance
  evaluatedAt: string;
}

export type ReleaseBlockerCategory =
  | 'CONSENT_BYPASS'
  | 'SAFETY_BYPASS'
  | 'MASTERY_CORRUPTION'
  | 'EVIDENCE_CORRUPTION'
  | 'CREDENTIAL_CORRUPTION'
  | 'UNAUTHORIZED_AI_ACTION'
  | 'IDENTITY_COMPROMISE'
  | 'MATERIAL_PRIVACY_VIOLATION'
  | 'UNCONTROLLED_SURVEILLANCE'
  | 'UNVALIDATED_CONSEQUENTIAL_DECISION'
  | 'CRITICAL_SECURITY_VULNERABILITY'
  | 'MATERIAL_EDUCATIONAL_REGRESSION'
  | 'FABRICATED_EVIDENCE'
  | 'RESEARCH_INTEGRITY_FAILURE';

export interface ReleaseGateEvaluation {
  releaseTag: string;
  isBlocked: boolean;
  blockersTriggered: ReleaseBlockerCategory[];
  evaluations: Array<{ category: ReleaseBlockerCategory; passed: boolean; details: string }>;
  evaluatedAt: string;
}

export type EvidenceHierarchyLevel =
  | 'TESTED'
  | 'OBSERVED'
  | 'PILOT_VALIDATED'
  | 'REPLICATED'
  | 'INDEPENDENTLY_VERIFIED'
  | 'EXTERNALLY_CORROBORATED'
  | 'LONGITUDINALLY_VALIDATED';

export interface EvidenceClaimRecord {
  claimId: string;
  claim: string;
  source: string;
  level: EvidenceHierarchyLevel;
  methodology: string;
  populationSize: number;
  confidence: number; // 0.0 - 1.0
  limitations: string;
  owner: string;
  verified: boolean;
  revalidationDueDate: string;
  updatedAt: string;
}

export type NegativeIncidentType =
  | 'FAILED_INTERVENTION'
  | 'SAFETY_INCIDENT'
  | 'MODEL_FAILURE'
  | 'FALSE_POSITIVE'
  | 'FALSE_NEGATIVE'
  | 'POOR_RECOMMENDATION'
  | 'LEARNING_REGRESSION'
  | 'INTEGRATION_FAILURE'
  | 'MOBILITY_FAILURE'
  | 'EQUITY_PROBLEM';

export interface NegativeEvidenceLedgerRecord {
  recordId: string;
  incidentType: NegativeIncidentType;
  description: string;
  rootCause: string;
  mitigationPreventativeAction: string;
  recordedAt: string;
}

export type CivilizationKillSwitchSubsystem =
  | 'AI_AUTONOMY'
  | 'SAFETY_SENSITIVE'
  | 'CREDENTIAL_ISSUANCE'
  | 'OPPORTUNITY_EXCHANGE'
  | 'MENTOR_NETWORK'
  | 'EXTERNAL_INTEGRATIONS'
  | 'COMMUNITY_FEATURES'
  | 'RESEARCH_ACCESS'
  | 'ECOSYSTEM_ANALYTICS'
  | 'GLOBAL_EMERGENCY';

export interface CivilizationKillSwitch {
  subsystem: CivilizationKillSwitchSubsystem;
  isTripped: boolean;
  trippedBy?: string;
  reason?: string;
  trippedAt?: string;
}

export type IncidentLifecycleStage =
  | 'DECLARED'
  | 'TRIAGED'
  | 'CONTAINED'
  | 'MITIGATED'
  | 'RECOVERED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'POSTMORTEM'
  | 'SYSTEMIC_IMPROVEMENT';

export interface IncidentRecord {
  incidentId: string;
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
  title: string;
  currentStage: IncidentLifecycleStage;
  timeline: Array<{
    stage: IncidentLifecycleStage;
    actor: string;
    timestamp: string;
    notes?: string;
  }>;
  postmortemUri?: string;
  systemicActionItem?: string;
  updatedAt: string;
}
