export enum GateState {
  AI_CONTINUE = 'AI_CONTINUE',
  TEACHER_REVIEW_REQUIRED = 'TEACHER_REVIEW_REQUIRED',
  SAFETY_ESCALATION = 'SAFETY_ESCALATION',
}

export enum ActivityType {
  EXPLANATION = 'EXPLANATION',
  PRACTICE = 'PRACTICE',
  SOCRATIC_DIALOGUE = 'SOCRATIC_DIALOGUE',
  REMEDIATION = 'REMEDIATION',
  CHALLENGE = 'CHALLENGE',
}

export enum Modality {
  TEXT = 'TEXT',
  VISUAL = 'VISUAL',
  INTERACTIVE = 'INTERACTIVE',
  AUDIO = 'AUDIO',
}

export enum Pacing {
  ACCELERATED = 'ACCELERATED',
  STANDARD = 'STANDARD',
  SLOW = 'SLOW',
}

export enum ActorType {
  STUDENT = 'STUDENT',
  AI = 'AI',
  TEACHER = 'TEACHER',
  SYSTEM = 'SYSTEM',
}

export enum EscalationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum EscalationStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum InterventionAction {
  APPROVE = 'APPROVE',
  OVERRIDE = 'OVERRIDE',
  INTERVENE = 'INTERVENE',
}

export enum InterventionStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export enum DecisionStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  OVERRIDDEN = 'OVERRIDDEN',
}
