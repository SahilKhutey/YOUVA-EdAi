export type AutonomyLevel = 'OBSERVE' | 'RECOMMEND' | 'SAFE_EXECUTE' | 'GOVERNED_ADAPTIVE';

export const AUTONOMY_LEVEL_VALUES: Record<AutonomyLevel, number> = {
  OBSERVE: 0,
  RECOMMEND: 1,
  SAFE_EXECUTE: 2,
  GOVERNED_ADAPTIVE: 3,
};

export type OrchestrationTrigger =
  | 'SYSTEMIC_GAP'
  | 'LEARNER_MASTERY_DROP'
  | 'INTERVENTION_TRIGGERED'
  | 'TEACHER_INITIATED'
  | 'CURRICULUM_UPDATE'
  | 'PERIODIC_OPTIMIZATION';

export type OrchestrationScope = 'LEARNER' | 'CLASS' | 'COURSE' | 'CURRICULUM' | 'TENANT';

export const SCOPE_HIERARCHY_LEVELS: Record<OrchestrationScope, number> = {
  LEARNER: 0,
  CLASS: 1,
  COURSE: 2,
  CURRICULUM: 3,
  TENANT: 4,
};

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
  targetIdPattern?: string; // e.g. "{{learnerId}}", "{{conceptId}}"
  targetId?: string;
  dependsOn?: number[]; // sequences
  payloadTemplate?: Record<string, any>;
  compensationAction?: string;
  timeoutMs?: number;
}

export interface WorkflowDefinitionDto {
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

export interface ApproveOrchestrationDto {
  approvedBy: string;
  notes?: string;
}

export interface OrchestrationStepDto {
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
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface LearningOrchestrationDto {
  id: string;
  tenantId: string;
  learnerId?: string | null;
  objective: string;
  triggerType: string;
  autonomyLevel: string;
  status: string;
  workflowId: string;
  workflowVersion: string;
  policyVersion: string;
  scope: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  steps?: OrchestrationStepDto[];
  escalations?: LearningEscalationDto[];
  explainability?: ExplainabilityContract;
}

export interface LearningEscalationDto {
  id: string;
  tenantId: string;
  orchestrationId: string;
  reason: string;
  severity: EscalationSeverity;
  evidenceIds: string[];
  recommendedAction: string;
  status: EscalationStatus;
  assignedTo?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface KillSwitchStatusDto {
  enabled: boolean; // true = automation enabled, false = kill switch activated (automation halted)
  lastUpdated: string;
  updatedBy?: string;
}
