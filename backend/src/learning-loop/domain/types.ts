import { ActivityType, Modality, Pacing, GateState, ActorType, EscalationSeverity } from './enums';

export interface StudentLearningContext {
  userId: string;
  topicId: string;
  subjectName?: string;
  topicTitle?: string;
  cognitiveLevel: string; // CHILD, TEEN, ADULT
  gradeLevel: string | null;
  currentMastery: number; // 0.0 - 1.0 (from BKT)
  currentDifficulty: number; // 0.1 - 1.0 (from RL)
  cognitiveLoad: number; // 0.0 - 1.0 (from cognitive twin)
  errorClusterScore: number; // 0.0 - 1.0
  inferredState: string; // flow, confusion, fatigue, deep_understanding
  recentMistakes: string[];
  activeGoals: Array<{ id: string; targetScore?: number; title?: string }>;
}

export interface LearningEvidenceInput {
  idempotencyKey: string;
  userId: string;
  topicId: string;
  answer: string;
  accuracy: number; // 0.0 - 1.0 (1.0 = fully correct)
  attemptNumber: number;
  hintCount: number;
  misconception?: string;
  engagementScore?: number;
  timeSpentSeconds?: number;
  metadata?: Record<string, any>;
}

export interface PersonalizationRecommendation {
  activityType: ActivityType;
  difficulty: number;
  modality: Modality;
  pacing: Pacing;
  recommendationRationale: string;
  isCertifiedMastery: false; // Invariant: AI can never certify mastery
  interventionSuggested: boolean;
}

export interface PolicyRuleEvaluation {
  ruleName: string;
  passed: boolean;
  severity?: EscalationSeverity;
  reason: string;
}

export interface PolicyGateResult {
  gateState: GateState;
  reason: string;
  ruleEvaluations: PolicyRuleEvaluation[];
  requiresTeacherReview: boolean;
  requiresSafetyEscalation: boolean;
  escalationSeverity?: EscalationSeverity;
}

export interface AuditLogEntry {
  userId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  stateBefore?: Record<string, any> | null;
  stateAfter: Record<string, any>;
  metadata?: Record<string, any>;
}
