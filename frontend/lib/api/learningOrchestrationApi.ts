import api from '../axios';

export type AutonomyLevel = 'OBSERVE' | 'RECOMMEND' | 'SAFE_EXECUTE' | 'GOVERNED_ADAPTIVE';

export type OrchestrationTrigger =
  | 'SYSTEMIC_GAP'
  | 'LEARNER_MASTERY_DROP'
  | 'INTERVENTION_TRIGGERED'
  | 'TEACHER_INITIATED'
  | 'CURRICULUM_UPDATE'
  | 'PERIODIC_OPTIMIZATION';

export type OrchestrationScope = 'LEARNER' | 'CLASS' | 'COURSE' | 'CURRICULUM' | 'TENANT';

export type OrchestrationStatus =
  | 'CREATED'
  | 'PLANNING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type StepStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'COMPENSATED';

export type ActionType =
  | 'TRIGGER_ASSESSMENT'
  | 'ASSIGN_REMEDIATION'
  | 'UPDATE_LEARNING_PATH'
  | 'NOTIFY_TEACHER'
  | 'SCHEDULE_REVIEW'
  | 'ADJUST_DIFFICULTY';

export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EscalationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface ExplainabilityContract {
  triggerReason: string;
  evidenceIds: string[];
  policyEvaluated: {
    policyVersion: string;
    autonomyLevel: AutonomyLevel;
    requiresHumanApproval: boolean;
    killSwitchActive: boolean;
    scopeChecked: boolean;
    scopeBreached: boolean;
    loopDetected: boolean;
  };
  workflowId: string;
  workflowVersion: string;
  approvedBy?: string;
  approvedAt?: string;
  executionAudit: Array<{
    stepSequence: number;
    actionType: string;
    targetId: string;
    status: StepStatus;
    timestamp: string;
    details?: string;
  }>;
}

export interface StepDefinition {
  sequence: number;
  actionType: ActionType;
  targetType: string;
  targetIdPattern?: string;
  targetId?: string;
  dependsOn?: number[];
  payloadTemplate?: Record<string, any>;
  compensationAction?: string;
  timeoutMs?: number;
}

export interface WorkflowDefinition {
  workflowKey: string;
  version: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  scope: OrchestrationScope;
  autonomyLevel: AutonomyLevel;
  definition: {
    steps: StepDefinition[];
    compensationPolicy?: 'BEST_EFFORT' | 'STRICT_ROLLBACK';
  };
  policyVersion: string;
}

export interface OrchestrationStep {
  id: string;
  orchestrationId: string;
  sequence: number;
  actionType: string;
  targetType: string;
  targetId: string;
  status: StepStatus;
  dependsOn?: any;
  payload?: any;
  result?: any;
  compensationAction?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface LearningEscalation {
  id: string;
  tenantId: string;
  orchestrationId: string;
  reason: string;
  severity: EscalationSeverity;
  evidenceIds: string[];
  recommendedAction: string;
  status: EscalationStatus;
  assignedTo?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface LearningOrchestration {
  id: string;
  tenantId: string;
  learnerId?: string | null;
  objective: string;
  triggerType: string;
  autonomyLevel: string;
  status: OrchestrationStatus;
  workflowId: string;
  workflowVersion: string;
  policyVersion: string;
  scope: OrchestrationScope;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  steps?: OrchestrationStep[];
  escalations?: LearningEscalation[];
  explainability?: ExplainabilityContract;
}

export interface KillSwitchStatus {
  enabled: boolean;
  lastUpdated: string;
  updatedBy?: string;
}

export interface TriggerOrchestrationDto {
  tenantId?: string;
  learnerId?: string;
  objective: string;
  triggerType: OrchestrationTrigger;
  scope?: OrchestrationScope;
  workflowId?: string;
  workflowVersion?: string;
  autonomyLevel?: AutonomyLevel;
  evidenceIds?: string[];
  context?: Record<string, any>;
}

export const learningOrchestrationApi = {
  // Core Orchestration
  triggerOrchestration: async (dto: TriggerOrchestrationDto): Promise<LearningOrchestration> => {
    const res = await api.post<LearningOrchestration>('/api/v1/learning-orchestration', dto);
    return res.data;
  },

  listOrchestrations: async (filter?: {
    tenantId?: string;
    learnerId?: string;
    status?: string;
    autonomyLevel?: string;
  }): Promise<LearningOrchestration[]> => {
    const res = await api.get<LearningOrchestration[]>('/api/v1/learning-orchestration', {
      params: filter,
    });
    return res.data;
  },

  getOrchestration: async (id: string): Promise<LearningOrchestration> => {
    const res = await api.get<LearningOrchestration>(`/api/v1/learning-orchestration/${id}`);
    return res.data;
  },

  approveOrchestration: async (
    id: string,
    dto: { approvedBy: string; notes?: string },
  ): Promise<LearningOrchestration> => {
    const res = await api.post<LearningOrchestration>(
      `/api/v1/learning-orchestration/${id}/approve`,
      dto,
    );
    return res.data;
  },

  pauseOrchestration: async (id: string): Promise<LearningOrchestration> => {
    const res = await api.post<LearningOrchestration>(`/api/v1/learning-orchestration/${id}/pause`);
    return res.data;
  },

  resumeOrchestration: async (id: string): Promise<LearningOrchestration> => {
    const res = await api.post<LearningOrchestration>(`/api/v1/learning-orchestration/${id}/resume`);
    return res.data;
  },

  cancelOrchestration: async (id: string, reason?: string): Promise<LearningOrchestration> => {
    const res = await api.post<LearningOrchestration>(
      `/api/v1/learning-orchestration/${id}/cancel`,
      { reason },
    );
    return res.data;
  },

  // Emergency Kill Switch
  getKillSwitchStatus: async (): Promise<KillSwitchStatus> => {
    const res = await api.get<KillSwitchStatus>('/api/v1/learning-orchestration/kill-switch');
    return res.data;
  },

  setKillSwitch: async (enabled: boolean, updatedBy?: string): Promise<KillSwitchStatus> => {
    const res = await api.post<KillSwitchStatus>('/api/v1/learning-orchestration/kill-switch', {
      enabled,
      updatedBy,
    });
    return res.data;
  },

  // Workflows Registry
  listWorkflows: async (filter?: {
    scope?: OrchestrationScope;
    status?: string;
  }): Promise<WorkflowDefinition[]> => {
    const res = await api.get<WorkflowDefinition[]>('/api/v1/learning-orchestration/workflows', {
      params: filter,
    });
    return res.data;
  },

  getWorkflow: async (key: string, version = '1.0.0'): Promise<WorkflowDefinition> => {
    const res = await api.get<WorkflowDefinition>(
      `/api/v1/learning-orchestration/workflows/${key}/${version}`,
    );
    return res.data;
  },

  // Escalations
  listEscalations: async (filter?: {
    tenantId?: string;
    status?: EscalationStatus;
    severity?: EscalationSeverity;
  }): Promise<LearningEscalation[]> => {
    const res = await api.get<LearningEscalation[]>('/api/v1/learning-orchestration/escalations', {
      params: filter,
    });
    return res.data;
  },

  acknowledgeEscalation: async (
    id: string,
    acknowledgedBy: string,
  ): Promise<LearningEscalation> => {
    const res = await api.post<LearningEscalation>(
      `/api/v1/learning-orchestration/escalations/${id}/acknowledge`,
      { acknowledgedBy },
    );
    return res.data;
  },

  resolveEscalation: async (
    id: string,
    resolvedBy: string,
    notes?: string,
  ): Promise<LearningEscalation> => {
    const res = await api.post<LearningEscalation>(
      `/api/v1/learning-orchestration/escalations/${id}/resolve`,
      { resolvedBy, notes },
    );
    return res.data;
  },
};
