import api from '../axios';

export interface ImprovementAction {
  id: string;
  planId: string;
  type: string;
  targetId?: string;
  executionMode: 'HUMAN' | 'AI_ASSISTED' | 'CONTROLLED_AUTOMATION';
  requiresApproval: boolean;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  actionOrder: number;
  payload?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ImprovementExecution {
  id: string;
  planId: string;
  actionId: string;
  executionKey: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  actorType: 'TEACHER' | 'ADMIN' | 'AI' | 'SYSTEM';
  actorId?: string;
  outputReference?: string;
  errorCode?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ImprovementOutcome {
  id: string;
  planId: string;
  metric: string;
  baselineValue: number;
  observedValue: number;
  delta: number;
  sampleSize: number;
  confidence?: number;
  status: 'INSUFFICIENT_DATA' | 'EVALUATING' | 'MEASURED';
  classification?: 'POSITIVE_SIGNAL' | 'NO_CLEAR_CHANGE' | 'NEGATIVE_SIGNAL' | 'MIXED_RESULT' | 'INSUFFICIENT_DATA';
  windowStart: string;
  windowEnd: string;
  createdAt: string;
}

export interface ImprovementPlan {
  id: string;
  tenantId: string;
  sourceInsightIds: string[];
  sourceRecommendationIds: string[];
  targetType: string;
  targetId: string;
  objective: string;
  hypothesis: string;
  baseline: {
    metric: string;
    windowStart: string;
    windowEnd: string;
    aggregation: string;
    minimumSampleSize: number;
  };
  successCriteria: {
    primaryMetric: string;
    targetDirection: string;
    targetValue: number;
    minimumSampleSize: number;
    evaluationWindowDays: number;
    guardrailMetrics: Array<{
      metric: string;
      acceptableTolerance: number;
      targetDirection: string;
    }>;
  };
  policyVersion: string;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'EXECUTING'
    | 'EVALUATING'
    | 'COMPLETED'
    | 'FAILED'
    | 'ROLLED_BACK'
    | 'CANCELLED';
  ownerId: string;
  approvedBy?: string;
  actions: ImprovementAction[];
  executions?: ImprovementExecution[];
  outcomes?: ImprovementOutcome[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEvolutionNode {
  versionId: string;
  version: number;
  publishedAt?: string;
  authorId: string;
  sourceType: string;
  learnerCount: number;
  derivedFromVersionId?: string;
  sourceInsightIds: string[];
  sourceRecommendationIds: string[];
  sourcePlanId?: string;
  aiAssisted: boolean;
  evaluationStatus?: string;
  primaryMetricDelta?: string;
}

export interface KnowledgeEvolutionTree {
  knowledgeObjectId: string;
  title: string;
  currentVersion: number;
  versions: KnowledgeEvolutionNode[];
}

export interface OptimizationOverview {
  activePlansCount: number;
  evaluationsRunningCount: number;
  completedImprovementsCount: number;
  reopenedImprovementsCount: number;
  systemStatus: {
    evidencePipeline: string;
    intelligenceEngine: string;
    optimizationWorkers: string;
    evaluationWorkers: string;
  };
}

export interface PlanEvaluationReport {
  planId: string;
  tenantId: string;
  primaryMetric: string;
  baselineValue: number;
  observedValue: number;
  delta: number;
  sampleSize: number;
  classification: string;
  guardrailResults: Array<{
    metric: string;
    baselineValue: number;
    observedValue: number;
    delta: number;
    acceptableTolerance: number;
    passed: boolean;
  }>;
  allGuardrailsPassed: boolean;
  canStandardize: boolean;
  requiresReopen: boolean;
  evaluatedAt: string;
  summary: string;
}

export const learningOptimizationApi = {
  // Overview
  getOverview: async (): Promise<OptimizationOverview> => {
    const res = await api.get('/api/v1/learning-optimization/overview');
    return res.data;
  },

  // Plans
  listPlans: async (status?: string): Promise<ImprovementPlan[]> => {
    const res = await api.get('/api/v1/learning-optimization/plans', {
      params: { status },
    });
    return res.data;
  },

  getPlan: async (id: string): Promise<ImprovementPlan> => {
    const res = await api.get(`/api/v1/learning-optimization/plans/${id}`);
    return res.data;
  },

  createPlan: async (data: Partial<ImprovementPlan>): Promise<ImprovementPlan> => {
    const res = await api.post('/api/v1/learning-optimization/plans', data);
    return res.data;
  },

  submitPlan: async (id: string): Promise<ImprovementPlan> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/submit`);
    return res.data;
  },

  approvePlan: async (id: string, approvedBy = 'lead-teacher'): Promise<ImprovementPlan> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/approve`, { approvedBy });
    return res.data;
  },

  executePlan: async (id: string, actorId = 'teacher-1'): Promise<any> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/execute`, { actorId });
    return res.data;
  },

  reopenPlan: async (id: string, reason: string, ownerId = 'teacher-1'): Promise<ImprovementPlan> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/reopen`, { reason, ownerId });
    return res.data;
  },

  cancelPlan: async (id: string): Promise<ImprovementPlan> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/cancel`);
    return res.data;
  },

  // Evaluation
  evaluatePlan: async (
    id: string,
    data: { observedPrimaryValue: number; sampleSize: number; observedGuardrails?: Record<string, number> },
  ): Promise<PlanEvaluationReport> => {
    const res = await api.post(`/api/v1/learning-optimization/plans/${id}/evaluate`, data);
    return res.data;
  },

  getOutcomes: async (id: string): Promise<ImprovementOutcome[]> => {
    const res = await api.get(`/api/v1/learning-optimization/plans/${id}/outcomes`);
    return res.data;
  },

  // Knowledge Evolution
  getKnowledgeEvolution: async (id: string): Promise<KnowledgeEvolutionTree> => {
    const res = await api.get(`/api/v1/learning-optimization/knowledge/${id}/evolution`);
    return res.data;
  },

  getVersionProvenance: async (id: string, version: number): Promise<any> => {
    const res = await api.get(`/api/v1/learning-optimization/knowledge/${id}/provenance/${version}`);
    return res.data;
  },

  rollbackVersion: async (
    id: string,
    rollbackPlan: { executionId: string; strategy: string; targetVersionId: string; reason: string },
  ): Promise<any> => {
    const res = await api.post(`/api/v1/learning-optimization/knowledge/${id}/rollback`, rollbackPlan);
    return res.data;
  },

  // Automation
  getAutomationPolicy: async (): Promise<any> => {
    const res = await api.get('/api/v1/learning-optimization/automation/policies');
    return res.data;
  },

  updateAutomationLevel: async (level: number, approvedBy = 'governance-admin'): Promise<any> => {
    const res = await api.post('/api/v1/learning-optimization/automation/level', { level, approvedBy });
    return res.data;
  },
};
