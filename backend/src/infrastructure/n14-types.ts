export type DemandClass =
  | 'D0_NO_DEMAND'
  | 'D1_EARLY_PILOT'
  | 'D2_REPEAT_PAID'
  | 'D3_INSTITUTIONAL'
  | 'D4_MULTI_INSTITUTION'
  | 'D5_LARGE_SCALE';

export interface WorkloadCapacityProfile {
  demandClass: DemandClass;
  maxConcurrentLearners: number;
  requestsPerMinuteLimit: number;
  dbConnectionPoolSize: number;
  redisPoolSize: number;
  p50TargetMs: number;
  p90TargetMs: number;
  p95TargetMs: number;
  p99TargetMs: number;
  monthlyAiBudgetUsd: number;
  dedicatedDbRequired: boolean;
}

export type TenantLifecycleState =
  | 'REQUESTED'
  | 'REVIEWED'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface TenantContext {
  tenantId: string;
  actorId: string;
  role: string;
  permissions: string[];
  correlationId: string;
}

export interface ManagedTenantRecord {
  tenantId: string;
  name: string;
  slug: string;
  lifecycleState: TenantLifecycleState;
  adminEmail: string;
  createdAt: string;
  updatedAt: string;
  suspensionReason?: string;
  policyConfig: TenantPolicyConfig;
}


export interface TenantPolicyConfig {
  tenantId: string;
  allowedAgeBands: string[];
  aiTutorEnabled: boolean;
  generativeMultimodalEnabled: boolean;
  maxDailyScreenMinutes: number;
  enforceChildSafetyModeration: boolean; // Cannot be false (Platform Safety Policy override)
  autonomousPurchasesAllowed: boolean; // Cannot be true for minors
  dataRetentionDays: number;
}

export type FeatureFlagScope = 'PLATFORM' | 'TENANT' | 'ROLE' | 'LEARNER_TIER' | 'PILOT';

export interface FeatureFlag {
  flagKey: string;
  name: string;
  purpose: string;
  owner: string;
  scope: FeatureFlagScope;
  scopeTargetId?: string; // e.g. tenantId or role
  isEnabled: boolean;
  environment: 'development' | 'test' | 'staging' | 'pilot' | 'production';
  reviewDate: string;
}

export interface AiSpendRecord {
  recordId: string;
  tenantId: string;
  learnerId: string;
  modelName: string;
  provider: 'GEMINI' | 'OLLAMA_LOCAL' | 'DETERMINISTIC_FALLBACK';
  purpose: string;
  tokenCount: number;
  costUsd: number;
  timestamp: string;
}

export interface AiBudgetHierarchy {
  tenantId: string;
  allocatedMonthlyBudgetUsd: number;
  currentSpendUsd: number;
  softWarningThresholdPercent: number; // e.g. 80%
  hardCapReached: boolean;
  learnerPerSessionLimitUsd: number;
}

export type IncidentSeverity = 'SEV_0' | 'SEV_1' | 'SEV_2' | 'SEV_3' | 'SEV_4';

export type IncidentLifecycleState =
  | 'DETECTED'
  | 'TRIAGED'
  | 'CONTAINED'
  | 'MITIGATED'
  | 'RECOVERED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'POSTMORTEM';

export interface IncidentRecord {
  incidentId: string;
  severity: IncidentSeverity;
  status: IncidentLifecycleState;
  title: string;
  tenantId?: string;
  isChildSafetyRelated: boolean;
  isCrossTenantRelated: boolean;
  commander: string;
  detectedAt: string;
  resolvedAt?: string;
  postmortemUrl?: string;
  auditTrail: Array<{
    timestamp: string;
    fromStatus: IncidentLifecycleState;
    toStatus: IncidentLifecycleState;
    actor: string;
    notes: string;
  }>;
}

export interface DisasterRecoveryDrillResult {
  drillId: string;
  executedAt: string;
  durationMs: number;
  rpoSecondsAchieved: number;
  rtoSecondsAchieved: number;
  restorationChecks: {
    tenantRestored: boolean;
    learnersRestored: boolean;
    masteryTruthRestored: boolean;
    assessmentsRestored: boolean;
    consentRecordsRestored: boolean;
    safetyIncidentsRestored: boolean;
    auditLedgerHashContinuous: boolean;
    credentialsRestored: boolean;
    billingEntitlementsRestored: boolean;
  };
  drillStatus: 'SUCCESS' | 'FAILURE';
}

export interface PlatformEvent {
  eventId: string;
  eventType: string;
  version: number;
  tenantId: string;
  aggregateId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  payload: Record<string, any>;
}

export type CommercialSubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface CommercialEntitlement {
  tenantId: string;
  planId: 'FREE' | 'PILOT' | 'SCHOOL_STANDARD' | 'INSTITUTIONAL_ENTERPRISE';
  status: CommercialSubscriptionStatus;
  maxSeats: number;
  activeLearnersCount: number;
  seatsRemaining: number;
  features: string[];
  currentPeriodEnd: string;
}
