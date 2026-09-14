export interface TutorContext {
  learnerAgeBand: string;
  subject: string;
  concept: string;
  masteryLevel: number;
  recentErrors: string[];
  currentActivity: string;
  userQuery: string;
  history?: Array<{ role: 'student' | 'tutor'; message: string }>;
}

export interface AssessmentFeedbackContext {
  subject: string;
  concept: string;
  learnerAgeBand?: string;
  questionContent: string;
  studentAnswer: string;
  expectedAnswer?: string;
  attemptCount?: number;
}

export interface TeacherSummaryContext {
  learnerAgeBand?: string;
  subject: string;
  topicMasteries: Array<{ topicId: string; topicName: string; masteryScore: number }>;
  recentInterventions?: Array<{ type: string; status: string; reason?: string }>;
  riskFactors?: string[];
}

export interface ParentSummaryContext {
  learnerAgeBand?: string;
  subject: string;
  currentStreakDays?: number;
  completedTopicsCount?: number;
  masteryDeltaSummary?: string;
}

export interface ContentDraftContext {
  subject: string;
  topic: string;
  gradeLevel: string;
  targetBloomLevel?: string;
  questionCount?: number;
}
