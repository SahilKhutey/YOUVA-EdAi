export enum ReliabilityAction {
  RESTART_WORKER = 'RESTART_WORKER',
  PAUSE_QUEUE = 'PAUSE_QUEUE',
  DISABLE_CANARY = 'DISABLE_CANARY',
  ENABLE_APPROVED_FALLBACK = 'ENABLE_APPROVED_FALLBACK',

  CHANGE_DATABASE_SCHEMA = 'CHANGE_DATABASE_SCHEMA',
  MODIFY_SECURITY_POLICY = 'MODIFY_SECURITY_POLICY',
  DISABLE_SAFETY = 'DISABLE_SAFETY',
}

export enum AutonomyLevel {
  AUTO_LOW_RISK = 'AUTO_LOW_RISK',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  BLOCKED = 'BLOCKED',
}

export interface CorrelationContext {
  correlationId: string;
  requestId?: string;
  tenantId?: string;
  learnerId?: string;
}

export interface GlobalDomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  tenantId?: string;
  actorId?: string;
  correlationId: string;
  occurredAt: string;
  payload: T;
}
