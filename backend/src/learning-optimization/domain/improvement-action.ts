export type ActionType =
  | 'CREATE_KNOWLEDGE'
  | 'REVISE_KNOWLEDGE'
  | 'ADD_EXAMPLE'
  | 'ADD_PRACTICE'
  | 'ADD_REMEDIATION'
  | 'REVISE_ASSESSMENT'
  | 'REVISE_RELATIONSHIP'
  | 'REVISE_PATH'
  | 'CREATE_EXPERIMENT'
  | 'UPDATE_POLICY';

export type ExecutionMode = 'HUMAN' | 'AI_ASSISTED' | 'CONTROLLED_AUTOMATION';

export type ActionStatus = 'PENDING' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface ImprovementActionDto {
  id: string;
  planId: string;
  type: ActionType;
  targetId?: string;
  executionMode: ExecutionMode;
  requiresApproval: boolean;
  status: ActionStatus;
  actionOrder: number;
  payload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
