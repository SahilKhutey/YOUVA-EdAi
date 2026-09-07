export enum AutonomyLevel {
  ASSISTIVE = 'ASSISTIVE',
  SUPERVISED = 'SUPERVISED',
  BOUNDED_AUTONOMOUS = 'BOUNDED_AUTONOMOUS',
  FULLY_AUTONOMOUS = 'FULLY_AUTONOMOUS', // Blocked by policy for education
}

export enum RiskClassification {
  AUTO_LOW_RISK = 'AUTO_LOW_RISK',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  BLOCKED = 'BLOCKED',
}

export enum AgentAction {
  // Low-risk bounded actions
  RECOMMEND_ACTIVITY = 'RECOMMEND_ACTIVITY',
  GENERATE_HINT = 'GENERATE_HINT',
  GENERATE_EXPLANATION = 'GENERATE_EXPLANATION',

  // Supervised actions
  RESCHEDULE_ACTIVITY = 'RESCHEDULE_ACTIVITY',
  ASSIGN_CONTENT = 'ASSIGN_CONTENT',

  // Strictly prohibited autonomous actions (Human Authority Invariant)
  MODIFY_MASTERY = 'MODIFY_MASTERY',
  MODIFY_CONSENT = 'MODIFY_CONSENT',
  MODIFY_ROLE = 'MODIFY_ROLE',
  CLOSE_SAFETY_CASE = 'CLOSE_SAFETY_CASE',
  DELETE_LEARNER = 'DELETE_LEARNER',
  CHANGE_BILLING = 'CHANGE_BILLING',
}

export enum AgeTier {
  KIDS = 'KIDS',     // < 13
  TEEN = 'TEEN',     // 13 - 17
  ADULT = 'ADULT',   // 18+
}

export interface LearningAgentRequest {
  tenantId?: string;
  learnerId?: string;
  agentKey: string;
  action: AgentAction;
  payload: any;
  ageTier?: AgeTier;
}

export interface LearningAgentDecision {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: RiskClassification;
  reason: string;
  action: AgentAction;
  policyVersion: string;
  inputHash: string;
}

export interface AgentRegistrationDto {
  key: string;
  name: string;
  description?: string;
  version?: string;
  autonomyLevel?: AutonomyLevel;
  configJson?: any;
}
