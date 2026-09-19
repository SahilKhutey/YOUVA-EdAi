// ============================================================================
// YOUVA-EdAI — Cycle N15 Controlled Autonomy Types & Domain Contracts
// Authoritative Clauses: N15.0 - N15.155
// ============================================================================

export type AutonomyClass =
  | 'A0_NONE'
  | 'A1_INFORMATIONAL'
  | 'A2_RECOMMENDATION'
  | 'A3_BOUNDED_EXECUTION'
  | 'A4_CONDITIONAL_AUTONOMOUS'
  | 'A5_HIGH_IMPACT_PROHIBITED';

export type ConsequentialActionType =
  | 'LEARNING_STATE_CHANGE'
  | 'MASTERY_OVERRIDE'
  | 'ASSESSMENT_RESULT'
  | 'SAFETY_RESOLUTION'
  | 'CONSENT_CHANGE'
  | 'PRIVACY_EXCEPTION'
  | 'CREDENTIAL_ISSUANCE'
  | 'CREDENTIAL_REVOCATION'
  | 'RBAC_CHANGE'
  | 'EXTERNAL_COMMUNICATION'
  | 'FINANCIAL_TRANSACTION'
  | 'ACCOUNT_DELETION';

export type AgentLifecycleState =
  | 'DRAFT'
  | 'EVALUATION'
  | 'SHADOW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'DEPRECATED'
  | 'RETIRED';

export interface AgentIdentity {
  agentId: string;
  name: string;
  version: string;
  owner: string;
  purpose: string;
  autonomyLevel: AutonomyClass;
  allowedActions: string[];
  deniedActions: ConsequentialActionType[];
  policyVersion: string;
  lifecycleState: AgentLifecycleState;
  createdAt: string;
  updatedAt: string;
}

export interface GovernedActionRequest {
  tenantId: string;
  actorId: string;
  agentId: string;
  purpose: string;
  actionType: string;
  targetType: string;
  targetId: string;
  parameters: Record<string, any>;
  authorizationContext?: {
    ticketId?: string;
    authorizedBy?: string;
    role?: string;
    expiresAt?: string;
  };
  policyVersion: string;
  correlationId: string;
  idempotencyKey: string;
}

export interface GovernedActionResult {
  executionId: string;
  status: 'EXECUTED' | 'HELD_FOR_HUMAN_APPROVAL' | 'DENIED' | 'FAILED';
  autonomyClass: AutonomyClass;
  reason: string;
  postConditionVerified: boolean;
  ticketId?: string;
  executionOutput?: any;
  auditId: string;
  timestamp: string;
}

export interface ToolDefinition {
  toolId: string;
  name: string;
  scope: string;
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  rateLimitPerMin: number;
  requiresHumanAuth: boolean;
  allowedTenantScopes: string[];
}

export interface AgentMessage {
  messageId: string;
  sourceAgent: string;
  targetAgent: string;
  tenantId: string;
  purpose: string;
  requestedAction: string;
  payload: Record<string, any>;
  policyVersion: string;
  correlationId: string;
}

export interface AgentAuditRecord {
  auditId: string;
  agentId: string;
  tenantId: string;
  actionType: string;
  targetId: string;
  autonomyLevel: AutonomyClass;
  policyVersion: string;
  authorizationStatus: 'VALID_HUMAN_AUTH' | 'PRE_AUTHORIZED_BOUNDED' | 'DENIED' | 'BYPASS_ATTEMPT';
  result: 'SUCCESS' | 'DENIED' | 'HELD' | 'FAILED';
  correlationId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface HumanAuthorizationTicket {
  ticketId: string;
  actionRequest: GovernedActionRequest;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceSummary: string;
  expectedImpact: string;
  policy: string;
  status: 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  reviewerId?: string;
  reviewerRole?: string;
  reviewerNotes?: string;
  modifiedParameters?: Record<string, any>;
}

export interface ModelVersionRecord {
  modelId: string;
  provider: 'GEMINI' | 'OLLAMA_LOCAL' | 'DETERMINISTIC_FALLBACK';
  version: string;
  capabilities: string[];
  allowedPurposes: string[];
  policyVersion: string;
  evaluationVersion: string;
  status: 'ACTIVE' | 'SHADOW' | 'DEPRECATED' | 'BLOCKED';
}

export interface TeacherAutonomyConfig {
  teacherId: string;
  tenantId: string;
  allowedDifficultyRange: { min: number; max: number };
  maxAutoInterventionsPerDay: number;
  autoSpacedReviewAllowed: boolean;
  allowedContentTags: string[];
  aiAssistanceLevel: 'RECOMMEND_ONLY' | 'BOUNDED_EXECUTION';
}

export interface AutonomyScorecard {
  tenantId: string;
  evaluatedAt: string;
  totalAgentActionsProposed: number;
  unauthorizedActionsAttempted: number;
  unauthorizedActionsRate: number; // Invariant: must be 0.0
  consequentialActionsBypassed: number; // Invariant: must be 0
  crossTenantLeakageEvents: number; // Invariant: must be 0
  safetyResolutionByAiCount: number; // Invariant: must be 0
  humanOverrideRatePercent: number; // Healthy rate e.g. 15-30%
  activeKillSwitchesCount: number;
  overallAutonomyDesignation: 'CONTROLLED_AUTONOMY_VALIDATED' | 'AUTONOMY_RESTRICTED' | 'AUTONOMY_SUSPENDED';
}
