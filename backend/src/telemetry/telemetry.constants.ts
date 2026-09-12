export enum TelemetryEventType {
  PRACTICE_ITEM_PRESENTED = 'PRACTICE_ITEM_PRESENTED',
  PRACTICE_ITEM_ANSWERED = 'PRACTICE_ITEM_ANSWERED',
  HINT_REQUESTED = 'HINT_REQUESTED',
  STEP_EXPANSION_VIEWED = 'STEP_EXPANSION_VIEWED',
  TEACHER_OVERRIDE_EXECUTED = 'TEACHER_OVERRIDE_EXECUTED',
  TEACHER_BYPASS_DETECTED = 'TEACHER_BYPASS_DETECTED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
}

export interface TelemetryEventDto {
  eventId: string;
  timestamp: string;
  eventType: TelemetryEventType;
  sessionId: string;
  cohortId: string;
  pseudonymizedStudentId: string;
  payload: Record<string, any>;
}
