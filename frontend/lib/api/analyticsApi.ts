import api from '../axios';

export interface LearnerAnalyticsOverview {
  learnerId: string;
  activeKnowledgeCount: number;
  masteredKnowledgeCount: number;
  developingKnowledgeCount: number;
  reviewDueCount: number;
  remediationCount: number;
  objectiveProgress: number;
  calculationVersion: string;
  activitySummary: {
    totalSessions: number;
    totalAttempts: number;
    totalHintsRequested: number;
    lastActiveAt?: string;
  };
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
    attempts: number;
  }>;
}

export interface TeacherClassAnalytics {
  classId: string;
  totalStudents: number;
  averageMastery: number;
  masteredCount: number;
  reviewDueCount: number;
  remediationCount: number;
  struggleSignals: Array<{
    knowledgeId: string;
    title: string;
    struggleCount: number;
    averageMastery: number;
  }>;
  distribution: {
    mastered: number;
    developing: number;
    struggling: number;
  };
}

export interface LearnerDrilldown {
  learnerId: string;
  name: string;
  email: string;
  concepts: Array<{
    knowledgeId: string;
    title: string;
    masteryLevel: number;
    confidence: number;
    status: string;
    attempts: number;
    correctAttempts: number;
    lastAttemptAccuracy?: number;
    totalHints: number;
    nextReviewAt?: string;
  }>;
}

export interface ContentAnalyticsOverview {
  knowledgeId: string;
  title: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  totalAttempts: number;
  averageAccuracy: number;
  totalHintsRequested: number;
  hintsPerSession: number;
  qualitySignals: string[];
  versionBreakdown: Array<{
    version: number;
    sessions: number;
    completions: number;
    completionRate: number;
  }>;
}

export interface CurriculumAnalyticsOverview {
  curriculumId: string;
  totalConcepts: number;
  publishedConcepts: number;
  objectiveCoverageRate: number;
  bottlenecks: Array<{
    knowledgeId: string;
    title: string;
    struggleRate: number;
    remediationCount: number;
    recommendation: 'INVESTIGATE';
    reason: string;
  }>;
}

export interface AdaptiveAnalyticsMetrics {
  totalDecisions: number;
  decisionsByAction: Record<string, number>;
  remediationCount: number;
  advancementCount: number;
  reviewCount: number;
  teacherInterventionCount: number;
  teacherOverrideCount: number;
  teacherOverrideRate: number;
}

export interface DecisionAuditTrace {
  decisionId: string;
  learnerId: string;
  targetKnowledgeId: string;
  action: string;
  reasonCode: string;
  reasonMessage?: string;
  priority: number;
  confidence: number;
  policyVersion: string;
  status: string;
  createdAt: string;
  executedAt?: string;
  learnerState?: {
    masteryLevel: number;
    confidence: number;
    status: string;
  };
  supportingEvidence: Array<{
    id: string;
    accuracy: number;
    attemptNumber: number;
    hintCount: number;
    createdAt: string;
  }>;
}

export interface AiAnalyticsMetrics {
  totalRequests: number;
  successRate: number;
  groundingComplianceRate: number;
  safetyComplianceRate: number;
  requestsByCapability: Record<string, number>;
  evaluationStatus: 'PASS' | 'WARNING' | 'FAIL';
}

export interface AiEvaluationResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  averageGroundingScore: number;
  status: 'PASS' | 'FAIL';
  executedAt: string;
}

export const analyticsApi = {
  /**
   * Retrieves current learner's own analytics overview.
   */
  async getLearnerOverview(): Promise<LearnerAnalyticsOverview> {
    const res = await api.get('/v1/analytics/me');
    return res.data;
  },

  /**
   * Retrieves purpose-limited drilldown for a single learner in a teacher context.
   */
  async getLearnerDrilldown(learnerId: string): Promise<LearnerDrilldown> {
    const res = await api.get(`/v1/analytics/learner/${learnerId}`);
    return res.data;
  },

  /**
   * Retrieves aggregated class-level analytics.
   */
  async getClassAnalytics(classId: string): Promise<TeacherClassAnalytics> {
    const res = await api.get(`/v1/analytics/class/${classId}`);
    return res.data;
  },

  /**
   * Retrieves content analytics, version lineage, and diagnostic quality signals.
   */
  async getContentAnalytics(knowledgeId: string): Promise<ContentAnalyticsOverview> {
    const res = await api.get(`/v1/analytics/knowledge/${knowledgeId}`);
    return res.data;
  },

  /**
   * Retrieves curriculum coverage, alignment, and bottleneck detection.
   */
  async getCurriculumAnalytics(curriculumId: string): Promise<CurriculumAnalyticsOverview> {
    const res = await api.get(`/v1/analytics/curriculum/${curriculumId}`);
    return res.data;
  },

  /**
   * Retrieves adaptive decision metrics and teacher override rates.
   */
  async getAdaptiveMetrics(): Promise<AdaptiveAnalyticsMetrics> {
    const res = await api.get('/v1/analytics/adaptive');
    return res.data;
  },

  /**
   * Reconstructs complete decision audit trace (Evidence -> State -> Decision).
   */
  async getDecisionTrace(decisionId: string): Promise<DecisionAuditTrace> {
    const res = await api.get(`/v1/analytics/adaptive/trace/${decisionId}`);
    return res.data;
  },

  /**
   * Retrieves AI operations and pedagogical safety/grounding metrics.
   */
  async getAiMetrics(): Promise<AiAnalyticsMetrics> {
    const res = await api.get('/v1/analytics/ai');
    return res.data;
  },

  /**
   * Triggers an AI evaluation regression run.
   */
  async runAiEvaluation(suiteName?: string): Promise<AiEvaluationResult> {
    const res = await api.post('/v1/analytics/ai/evaluate', { suiteName });
    return res.data;
  },

  /**
   * Requests a governed analytics export with small-cohort protection.
   */
  async requestExport(
    reportType: string,
    scopeId?: string,
    format: string = 'CSV',
  ): Promise<any> {
    const res = await api.post('/v1/analytics/exports', {
      reportType,
      scopeId,
      format,
    });
    return res.data;
  },
};
