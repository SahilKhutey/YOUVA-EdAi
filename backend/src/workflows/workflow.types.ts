export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum StepType {
  AUTO_TASK = 'AUTO_TASK',
  AI_GENERATION = 'AI_GENERATION',
  HUMAN_GATE = 'HUMAN_GATE',
  NOTIFICATION = 'NOTIFICATION',
}

export interface WorkflowStepDefinition {
  id: string;
  name: string;
  type: StepType;
  requiresApproval?: boolean;
  nextStepId?: string;
  failStepId?: string;
  action?: string;
  config?: any;
}

export interface WorkflowDefinition {
  initialStepId: string;
  steps: Record<string, WorkflowStepDefinition>;
}

export interface CreateWorkflowDto {
  key: string;
  name: string;
  description?: string;
  version?: string;
  definition: WorkflowDefinition;
}

export const LEGAL_WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  [WorkflowStatus.PENDING]: [WorkflowStatus.RUNNING, WorkflowStatus.CANCELLED],
  [WorkflowStatus.RUNNING]: [
    WorkflowStatus.WAITING_APPROVAL,
    WorkflowStatus.COMPLETED,
    WorkflowStatus.FAILED,
    WorkflowStatus.CANCELLED,
  ],
  [WorkflowStatus.WAITING_APPROVAL]: [
    WorkflowStatus.RUNNING,
    WorkflowStatus.CANCELLED,
    WorkflowStatus.FAILED,
  ],
  [WorkflowStatus.COMPLETED]: [],
  [WorkflowStatus.FAILED]: [],
  [WorkflowStatus.CANCELLED]: [],
};
