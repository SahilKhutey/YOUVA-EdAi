export type FeedbackType = 'corrective' | 'reinforcement' | 'extension';

export interface LearningFeedback {
  type: FeedbackType;
  message: string;
  nextStep?: string;
  misconception?: string;
}

export interface CorrelationChain {
  requestId: string;
  sessionId: string;
  attemptId: string;
  learningEventId: string;
  masteryEventId: string;
  auditEventId: string;
}

export interface LearningAttemptRequest {
  learnerId: string;
  sessionId: string;
  activityId: string;
  response: unknown;
  clientAttemptId: string;
  timestamp: string;
}

export interface LearningAttemptResult {
  attemptId: string;
  activityId: string;
  correctness: boolean;
  masteryBefore: number;
  masteryAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  nextActivityId: string | null;
  feedback: LearningFeedback;
  persisted: true;
  auditEventId: string;
  correlationChain: CorrelationChain;
}

export enum LearnerSessionState {
  SESSION_CREATED = 'SESSION_CREATED',
  DIAGNOSTIC_STARTED = 'DIAGNOSTIC_STARTED',
  LEARNING_STARTED = 'LEARNING_STARTED',
  ACTIVITY_ATTEMPTED = 'ACTIVITY_ATTEMPTED',
  MASTERY_UPDATED = 'MASTERY_UPDATED',
  NEXT_ACTIVITY_SELECTED = 'NEXT_ACTIVITY_SELECTED',
  SESSION_PAUSED = 'SESSION_PAUSED',
  SESSION_RESUMED = 'SESSION_RESUMED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  SESSION_RECOVERED = 'SESSION_RECOVERED',
}

export interface ConceptMasteryScore {
  concept: string;
  mastery: number;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DiagnosticResult {
  sessionId: string;
  learnerId: string;
  overallScore: number;
  conceptMastery: ConceptMasteryScore[];
  identifiedGaps: string[];
  recommendedFirstActivityId: string;
  state: LearnerSessionState;
}

export interface LearningPriority {
  concept: string;
  mastery: number;
  priority: 'high' | 'medium' | 'low';
  recommendedAction: 'remediation' | 'guided practice' | 'standard practice' | 'reinforcement' | 'extension';
}

export interface CreateSessionDto {
  topicId: string;
  mode?: 'diagnostic' | 'practice' | 'assessment';
  tenantId?: string;
}

export interface SubmitDiagnosticDto {
  answers: Array<{
    questionId: string;
    concept: string;
    answer: string;
  }>;
}
