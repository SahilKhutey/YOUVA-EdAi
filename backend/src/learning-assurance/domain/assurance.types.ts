export type AssuranceDomain =
  | 'KNOWLEDGE'
  | 'LEARNING'
  | 'ASSESSMENT'
  | 'AI'
  | 'PERSONALIZATION'
  | 'ORCHESTRATION'
  | 'DATA'
  | 'SECURITY'
  | 'OPERATIONS';

export type FindingSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'REMEDIATING'
  | 'RESOLVED'
  | 'WAIVED';

export type EvaluationStatus = 'PASS' | 'WARNING' | 'FAIL' | 'BLOCKED';

export type GateStatus = 'PENDING' | 'PASSED' | 'WARNING' | 'FAILED' | 'BLOCKED';

export type RepairPermission = 'AUTO_REPAIR' | 'HUMAN_APPROVAL' | 'BLOCKED';

export type GroundingStatus = 'GROUNDED' | 'PARTIAL' | 'UNSUPPORTED';

export interface QualityCheckResult {
  checkId: string;
  category: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  evidenceIds: string[];
  severity: FindingSeverity;
}

export interface KnowledgeQualityResult {
  knowledgeObjectId: string;
  knowledgeVersionId?: string;
  status: EvaluationStatus;
  checks: QualityCheckResult[];
  methodologyVersion: string;
  evaluatedAt: Date;
}

export interface AssuranceGate {
  targetType: string;
  targetId: string;
  checks: string[];
  requiredChecks: string[];
  status: GateStatus;
  policyVersion: string;
  evaluatedAt: Date;
  reasons?: string[];
}

export interface DecisionAssurance {
  decisionId: string;
  evidenceValid: boolean;
  learnerStateValid: boolean;
  policyValid: boolean;
  authorizationValid: boolean;
  targetValid: boolean;
  violations: string[];
  status: 'PASS' | 'WARNING' | 'BLOCK';
}

export interface AIAssuranceRecord {
  generationId: string;
  provider: string;
  model: string;
  inputReferences: string[];
  outputHash: string;
  groundingStatus: GroundingStatus;
  policyStatus: 'PASS' | 'WARNING' | 'BLOCK';
  humanReviewRequired: boolean;
  methodologyVersion: string;
  violations?: string[];
}

export interface ExecutionGateResult {
  orchestrationId: string;
  workflowValid: boolean;
  policyValid: boolean;
  authorizationValid: boolean;
  scopeValid: boolean;
  dependenciesValid: boolean;
  versionValid: boolean;
  status: 'ALLOW' | 'PAUSE' | 'BLOCK';
  reasons: string[];
}

export interface AssuranceFindingDto {
  id: string;
  tenantId: string;
  domain: AssuranceDomain;
  targetType: string;
  targetId: string;
  ruleId: string;
  ruleVersion: string;
  severity: FindingSeverity;
  status: FindingStatus;
  fingerprint?: string | null;
  message?: string | null;
  evidenceIds?: string[] | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface AssuranceRuleDto {
  id: string;
  version: string;
  domain: AssuranceDomain;
  severity: FindingSeverity;
  enabled: boolean;
  definition: Record<string, any>;
  action: 'WARN' | 'BLOCK' | 'ESCALATE';
  effectiveFrom: Date;
  createdAt: Date;
}

export interface AssuranceEvaluationDto {
  id: string;
  tenantId: string;
  targetType: string;
  targetId: string;
  methodologyVersion: string;
  status: EvaluationStatus;
  result: Record<string, any>;
  createdAt: Date;
}

export interface EvaluateTargetDto {
  tenantId?: string;
  targetType: string;
  targetId: string;
  domains?: AssuranceDomain[];
  payload?: Record<string, any>;
}

export interface AcknowledgeFindingDto {
  acknowledgedBy: string;
  notes?: string;
}

export interface ResolveFindingDto {
  resolvedBy: string;
  resolutionNotes: string;
}

export interface WaiveFindingDto {
  waivedBy: string;
  reason: string;
  policy: string;
  expiry: Date;
  scope: string;
}

export interface ReconciliationReport {
  reconciliationId: string;
  target: 'KNOWLEDGE' | 'EVENTS' | 'SEARCH' | 'ANALYTICS' | 'ORCHESTRATION';
  timestamp: string;
  status: 'CONSISTENT' | 'MISMATCH_DETECTED';
  mismatchesFound: number;
  details: Array<{
    targetId: string;
    expected: any;
    actual: any;
    gapType: string;
  }>;
  suggestedRepair: string;
}

export interface RepairRequestDto {
  repairAction: string;
  targetType: string;
  targetId: string;
  reason: string;
  actor: string;
}

export interface RepairResultDto {
  repairId: string;
  action: string;
  permission: RepairPermission;
  status: 'COMPLETED' | 'QUEUED' | 'REJECTED' | 'BLOCKED';
  message: string;
  executedAt: string;
}

export interface AssuranceOverviewDto {
  openFindingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  domainCounts: Record<AssuranceDomain, number>;
  blockedActionsCount: number;
  pendingReviewsCount: number;
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_RISK';
  lastEvaluatedAt: string;
}
