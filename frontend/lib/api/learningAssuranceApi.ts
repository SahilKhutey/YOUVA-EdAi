import api from '../axios';

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

export interface QualityCheckResult {
  checkId: string;
  category: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  evidenceIds: string[];
  severity: FindingSeverity;
}

export interface AssuranceFinding {
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
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AssuranceRule {
  id: string;
  version: string;
  domain: AssuranceDomain;
  severity: FindingSeverity;
  enabled: boolean;
  definition: Record<string, any>;
  action: 'WARN' | 'BLOCK' | 'ESCALATE';
  effectiveFrom: string;
  createdAt: string;
}

export interface AssuranceOverview {
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

export interface AssuranceGate {
  targetType: string;
  targetId: string;
  checks: string[];
  requiredChecks: string[];
  status: GateStatus;
  policyVersion: string;
  evaluatedAt: string;
  reasons?: string[];
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

export interface RepairResult {
  repairId: string;
  action: string;
  permission: RepairPermission;
  status: 'COMPLETED' | 'QUEUED' | 'REJECTED' | 'BLOCKED';
  message: string;
  executedAt: string;
}

export const learningAssuranceApi = {
  getOverview: async (tenantId?: string): Promise<AssuranceOverview> => {
    const res = await api.get<AssuranceOverview>('/api/v1/assurance/overview', {
      params: { tenantId },
    });
    return res.data;
  },

  listFindings: async (filter?: {
    tenantId?: string;
    domain?: AssuranceDomain;
    severity?: FindingSeverity;
    status?: FindingStatus;
    targetType?: string;
  }): Promise<AssuranceFinding[]> => {
    const res = await api.get<AssuranceFinding[]>('/api/v1/assurance/findings', {
      params: filter,
    });
    return res.data;
  },

  getFinding: async (id: string): Promise<AssuranceFinding> => {
    const res = await api.get<AssuranceFinding>(`/api/v1/assurance/findings/${id}`);
    return res.data;
  },

  acknowledgeFinding: async (
    id: string,
    dto: { acknowledgedBy: string; notes?: string },
  ): Promise<AssuranceFinding> => {
    const res = await api.post<AssuranceFinding>(
      `/api/v1/assurance/findings/${id}/acknowledge`,
      dto,
    );
    return res.data;
  },

  resolveFinding: async (
    id: string,
    dto: { resolvedBy: string; resolutionNotes: string },
  ): Promise<AssuranceFinding> => {
    const res = await api.post<AssuranceFinding>(
      `/api/v1/assurance/findings/${id}/resolve`,
      dto,
    );
    return res.data;
  },

  waiveFinding: async (
    id: string,
    dto: {
      waivedBy: string;
      reason: string;
      policy: string;
      expiry: string;
      scope: string;
    },
  ): Promise<AssuranceFinding> => {
    const res = await api.post<AssuranceFinding>(
      `/api/v1/assurance/findings/${id}/waive`,
      dto,
    );
    return res.data;
  },

  listRules: async (domain?: AssuranceDomain): Promise<AssuranceRule[]> => {
    const res = await api.get<AssuranceRule[]>('/api/v1/assurance/rules', {
      params: { domain },
    });
    return res.data;
  },

  getRule: async (id: string): Promise<AssuranceRule> => {
    const res = await api.get<AssuranceRule>(`/api/v1/assurance/rules/${id}`);
    return res.data;
  },

  evaluatePublicationGate: async (
    targetType: string,
    targetId: string,
    payload?: any,
  ): Promise<AssuranceGate> => {
    const res = await api.post<AssuranceGate>('/api/v1/assurance/gates/publication', {
      targetType,
      targetId,
      payload,
    });
    return res.data;
  },

  evaluateExecutionGate: async (
    orchestrationId: string,
    gateParams: any,
  ): Promise<ExecutionGateResult> => {
    const res = await api.post<ExecutionGateResult>('/api/v1/assurance/gates/execution', {
      orchestrationId,
      gateParams,
    });
    return res.data;
  },

  reconcile: async (
    target: 'KNOWLEDGE' | 'EVENTS' | 'ANALYTICS',
    tenantId?: string,
  ): Promise<ReconciliationReport> => {
    const res = await api.post<ReconciliationReport>('/api/v1/assurance/reconcile', {
      target,
      tenantId,
    });
    return res.data;
  },

  executeRepair: async (dto: {
    repairAction: string;
    targetType: string;
    targetId: string;
    reason: string;
    actor: string;
  }): Promise<RepairResult> => {
    const res = await api.post<RepairResult>('/api/v1/assurance/repair', dto);
    return res.data;
  },
};
