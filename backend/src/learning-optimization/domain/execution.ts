export type ExecutionStatus = 'STARTED' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export type ActorType = 'TEACHER' | 'ADMIN' | 'AI' | 'SYSTEM';

export interface ImprovementExecutionDto {
  id: string;
  planId: string;
  actionId: string;
  tenantId: string;
  executionKey: string;
  status: ExecutionStatus;
  attempts: number;
  actorType: ActorType;
  actorId?: string;
  inputReference?: string;
  outputReference?: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}
