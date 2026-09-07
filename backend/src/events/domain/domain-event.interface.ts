export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  tenantId?: string;
  actorId?: string;
  timestamp: string;
  version: string;
}

export interface DomainEvent<T = any> {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  metadata: EventMetadata;
}

export enum StandardDomainEvents {
  LEARNER_EVIDENCE_RECORDED = 'learner.evidence.recorded',
  MASTERY_UPDATED = 'learner.mastery.updated',
  COGNITIVE_STATE_SHIFTED = 'learner.cognitive_state.shifted',
  POLICY_GATE_REJECTED = 'policy.gate.rejected',
  SAFETY_ESCALATION_TRIGGERED = 'safety.escalation.triggered',
  SAFETY_ESCALATION_RESOLVED = 'safety.escalation.resolved',
  TEACHER_INTERVENTION_COMMITTED = 'teacher.intervention.committed',
  TEACHER_OVERRIDE_APPLIED = 'teacher.override.applied',
  PARENT_CONSENT_REVOKED = 'parent.consent.revoked',
  COHORT_STUDENT_ENROLLED = 'institutional.cohort.student_enrolled',
  MODEL_EVALUATION_LOGGED = 'ai.model.evaluation_logged',
}
