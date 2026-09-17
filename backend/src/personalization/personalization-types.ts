export interface LearnerLearningState {
  learnerId: string;
  tenantId: string;
  conceptMastery: Record<string, number>; // Topic ID -> score in [0.0, 1.0]
  evidenceConfidence: Record<string, number>; // Topic ID -> confidence in [0.0, 1.0]
  recentPerformance: number; // 0.0 - 1.0
  errorPatterns: string[];
  retentionRisk: Record<string, number>; // Topic ID -> risk in [0.0, 1.0]
  preferredActivityTypes: string[];
  pacingSignal: number; // 1.0 = normal, < 1.0 = needs more time, > 1.0 = fast
  interventionHistory: string[];
  lastUpdated: string;
}

export interface PersonalizationPolicy {
  version: string;
  remediationThreshold: number; // e.g. 0.60
  guidedPracticeThreshold: number; // e.g. 0.75
  standardPracticeThreshold: number; // e.g. 0.85
  extensionThreshold: number; // e.g. 0.85
  maxDifficultyJump: number; // e.g. 0.20
  retentionWindowDays: number; // e.g. 7
  confidenceThreshold: number; // e.g. 0.70 for full adaptation
}

export interface DecisionFactor {
  factor: string;
  direction: 'positive' | 'negative';
  weight: number;
}

export interface LearningDecisionExplanation {
  decisionId: string;
  learnerId: string;
  selectedActivityId: string;
  activityTitle: string;
  reasons: DecisionFactor[];
  policyVersion: string;
  createdAt: string;
}

export type TeacherFeedbackAction = 'ACCEPT' | 'MODIFY' | 'REJECT';

export type TeacherOverrideReasonCode =
  | 'INCORRECT_DIAGNOSIS'
  | 'WRONG_DIFFICULTY'
  | 'WRONG_CONTENT'
  | 'LEARNER_CONTEXT'
  | 'TIMING_ISSUE'
  | 'ALREADY_MASTERED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'OTHER';

export interface TeacherFeedbackRecord {
  id: string;
  tenantId: string;
  teacherId: string;
  learnerId: string;
  recommendationId: string;
  action: TeacherFeedbackAction;
  reasonCode: TeacherOverrideReasonCode;
  teacherNotes?: string;
  submittedAt: string;
}

export interface SpacedRepetitionItem {
  topicId: string;
  intervalDays: number;
  easeFactor: number;
  repetitionNumber: number;
  lastReviewedAt: string;
  nextReviewDate: string;
  retentionRisk: number; // 0.0 (safe) to 1.0 (high risk of forgetting)
}

export interface PolicyRegistryEntry {
  version: string;
  status: 'ACTIVE' | 'CANDIDATE' | 'DEPRECATED';
  deployedAt: string;
  policy: PersonalizationPolicy;
  checksumSha256: string;
}
