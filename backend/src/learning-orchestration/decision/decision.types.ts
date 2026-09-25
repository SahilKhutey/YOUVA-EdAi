export enum AdaptiveActionType {
  CONTINUE = 'CONTINUE',
  REVIEW = 'REVIEW',
  PRACTICE = 'PRACTICE',
  REMEDIATE = 'REMEDIATE',
  EXPLAIN = 'EXPLAIN',
  HINT = 'HINT',
  EXAMPLE = 'EXAMPLE',
  REATTEMPT = 'REATTEMPT',
  ADVANCE = 'ADVANCE',
  EXTEND = 'EXTEND',
  REINFORCE = 'REINFORCE',
  REFLECT = 'REFLECT',
  PAUSE = 'PAUSE',
  TEACHER_INTERVENTION = 'TEACHER_INTERVENTION',
}

export enum AdaptiveReasonCode {
  LOW_MASTERY = 'LOW_MASTERY',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  PREREQUISITE_NOT_READY = 'PREREQUISITE_NOT_READY',
  REPEATED_ERROR = 'REPEATED_ERROR',
  MISCONCEPTION_SIGNAL = 'MISCONCEPTION_SIGNAL',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
  RECENT_FAILURE = 'RECENT_FAILURE',
  REVIEW_DUE = 'REVIEW_DUE',
  ASSIGNMENT_REQUIRED = 'ASSIGNMENT_REQUIRED',
  CURRICULUM_SEQUENCE = 'CURRICULUM_SEQUENCE',
  READY_TO_ADVANCE = 'READY_TO_ADVANCE',
  EXTENSION_AVAILABLE = 'EXTENSION_AVAILABLE',
  TEACHER_DIRECTED = 'TEACHER_DIRECTED',
  LEARNER_REQUESTED_SUPPORT = 'LEARNER_REQUESTED_SUPPORT',
  SESSION_RESUME = 'SESSION_RESUME',
  KNOWLEDGE_COMPLETED = 'KNOWLEDGE_COMPLETED',
}

export enum CandidateSource {
  ASSIGNMENT = 'ASSIGNMENT',
  CURRICULUM = 'CURRICULUM',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  REVIEW_QUEUE = 'REVIEW_QUEUE',
  PERSONALIZATION = 'PERSONALIZATION',
  TEACHER_PATH = 'TEACHER_PATH',
  AI_SUGGESTION = 'AI_SUGGESTION',
  SESSION_RESUME = 'SESSION_RESUME',
}

export interface AdaptiveLearningAction {
  id: string;
  learnerId: string;
  tenantId: string;

  sourceKnowledgeId?: string;
  sourceKnowledgeVersionId?: string;

  targetKnowledgeId: string;
  targetKnowledgeVersionId?: string;
  targetTitle?: string;

  action: AdaptiveActionType;
  reasonCode: AdaptiveReasonCode;
  reasonMessage: string;

  priority: number;
  confidence: number;
  required: boolean;

  expiresAt?: Date;
  decisionId: string;
  policyVersion: string;
  createdAt: Date;
}

export interface CandidateEligibility {
  eligible: boolean;
  failureReason?: string;
}

export interface AdaptiveCandidate {
  knowledgeId: string;
  knowledgeTitle?: string;
  action: AdaptiveActionType;
  source: CandidateSource;
  required: boolean;
  reasonCodes: AdaptiveReasonCode[];
  priority: number;
  confidence?: number;
  eligibility?: CandidateEligibility;
  metadata?: Record<string, any>;
}

export interface PrerequisiteReadiness {
  knowledgeId: string;
  ready: boolean;
  mastery: number;
  confidence: number;
  unmetPrerequisites: string[];
  blocking: boolean;
}

export interface MasteryPolicy {
  minimumMasteryForAdvance: number;
  minimumConfidenceForAdvance: number;
  struggleThreshold: number;
  reviewIntervalDays: number;
  minimumEvidenceCount: number;
}

export interface AdaptivePolicy {
  masteryThreshold: number;
  confidenceThreshold: number;
  struggleThreshold: number;
  minimumEvidence: number;
  reviewIntervalDays: number;
  maxRemediationDepth: number;
  maxInterventionsPerSession: number;
  allowAiCandidates: boolean;
}

export interface StruggleSignal {
  learnerId: string;
  knowledgeId: string;
  score: number;
  evidenceIds: string[];
  signals: string[];
  detectedAt: Date;
}

export interface RemediationContext {
  sourceKnowledgeId: string;
  remediationKnowledgeId: string;
  startedAt: Date;
  entryReason: AdaptiveReasonCode;
  returnThreshold: number;
  attempts: number;
}

export interface TeacherOverride {
  teacherId: string;
  learnerId: string;
  decisionId?: string;
  action: string;
  targetKnowledgeId?: string;
  reason?: string;
  createdAt: Date;
}

export interface CandidateScore {
  curriculumFit: number;
  assignmentFit: number;
  prerequisiteFit: number;
  masteryNeed: number;
  reviewNeed: number;
  struggleNeed: number;
  learnerPreferenceFit: number;
  teacherPriority: number;
  totalScore: number;
}

export interface AdaptiveSessionContext {
  sessionId: string;
  learnerId: string;
  tenantId: string;
  currentKnowledgeId?: string;
  currentVersionId?: string;
  currentAction?: AdaptiveActionType;
  startedAt: Date;
  lastInteractionAt?: Date;
  interventionLevel: number;
  remediationDepth: number;
  remediationTargetId?: string;
  actionsTaken: string[];
}
