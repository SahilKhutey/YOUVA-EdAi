import api from '../axios';

export interface LearningInsight {
  id: string;
  tenantId: string;
  type: string;
  scope: string;
  entityId?: string;
  title: string;
  summary: string;
  evidenceIds: string[];
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  ruleVersion: string;
  detectedAt: string;
  createdAt: string;
}

export interface ImprovementOpportunity {
  id: string;
  tenantId: string;
  insightIds: string[];
  type: string;
  targetType: string;
  targetId: string;
  priority: number;
  expectedImpact?: number;
  effortEstimate?: number;
  status: string;
  createdAt: string;
}

export interface ImprovementRecommendation {
  id: string;
  tenantId: string;
  opportunityId: string;
  actionType: string;
  targetId: string;
  reason: string;
  evidenceIds: string[];
  expectedEffect?: string;
  confidence: number;
  requiresHumanApproval: boolean;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED' | 'EVALUATING' | 'RESOLVED' | 'DISMISSED';
  implementedVersionId?: string;
  createdAt: string;
}

export interface TeacherIntelligenceOverview {
  needsAttention: {
    knowledgeCount: number;
    learnerPatternCount: number;
    curriculumOpportunityCount: number;
    assessmentSignalCount: number;
  };
  insights: LearningInsight[];
  opportunities: ImprovementOpportunity[];
  recommendations: ImprovementRecommendation[];
  recentImprovements: Array<{
    title: string;
    actionType: string;
    status: string;
    implementedAt: string;
  }>;
}

export interface KnowledgeQualityProfile {
  knowledgeId: string;
  title: string;
  engagement: {
    completionRate: number;
    returnRate: number;
    abandonmentRate: number;
  };
  learning: {
    objectiveCompletionRate: number;
    masteryProgressionRate: number;
    assessmentSuccessRate: number;
  };
  support: {
    hintRate: number;
    explanationRate: number;
    remediationRate: number;
  };
  difficulty: {
    struggleRate: number;
    repeatedErrorRate: number;
  };
  confidence: number;
  sampleSize: number;
  flags: string[];
  calculatedAt: string;
}

export interface CurriculumCoverageReport {
  curriculumId: string;
  subjectCoverage: number;
  topicCoverage: number;
  objectiveCoverage: number;
  prerequisiteCoverage: number;
  remediationCoverage: number;
  gaps: Array<{
    type: string;
    knowledgeId: string;
    title: string;
    description: string;
    severity: string;
  }>;
}

export interface IntelligenceExperiment {
  id: string;
  tenantId: string;
  name: string;
  hypothesis: string;
  targetType: string;
  targetId: string;
  controlVersionId?: string;
  variantVersionId?: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startAt?: string;
  endAt?: string;
  ownerId: string;
  approvedBy?: string;
  metrics?: string;
  createdAt: string;
}

export interface AiGovernanceMetrics {
  totalSuggestionsGenerated: number;
  acceptedCount: number;
  editedCount: number;
  rejectedCount: number;
  acceptanceRate: number;
  teacherOverrideRate: number;
  groundingComplianceRate: number;
  evaluationStatus: 'PASS' | 'WARNING' | 'FAIL';
}

export const learningIntelligenceApi = {
  async getTeacherOverview(): Promise<TeacherIntelligenceOverview> {
    const res = await api.get('/v1/learning-intelligence/teacher/overview');
    return res.data;
  },

  async getInsights(scope?: string, status?: string): Promise<LearningInsight[]> {
    const res = await api.get('/v1/learning-intelligence/teacher/insights', {
      params: { scope, status },
    });
    return res.data;
  },

  async getOpportunities(): Promise<ImprovementOpportunity[]> {
    const res = await api.get('/v1/learning-intelligence/teacher/opportunities');
    return res.data;
  },

  async getRecommendations(): Promise<ImprovementRecommendation[]> {
    const res = await api.get('/v1/learning-intelligence/teacher/recommendations');
    return res.data;
  },

  async acceptRecommendation(id: string): Promise<ImprovementRecommendation> {
    const res = await api.post(`/v1/learning-intelligence/teacher/recommendations/${id}/accept`);
    return res.data;
  },

  async dismissRecommendation(id: string): Promise<ImprovementRecommendation> {
    const res = await api.post(`/v1/learning-intelligence/teacher/recommendations/${id}/dismiss`);
    return res.data;
  },

  async getKnowledgeQuality(id: string): Promise<KnowledgeQualityProfile> {
    const res = await api.get(`/v1/learning-intelligence/knowledge/${id}/quality`);
    return res.data;
  },

  async getCurriculumCoverage(id: string): Promise<CurriculumCoverageReport> {
    const res = await api.get(`/v1/learning-intelligence/curriculum/${id}/coverage`);
    return res.data;
  },

  async getExperiments(): Promise<IntelligenceExperiment[]> {
    const res = await api.get('/v1/learning-intelligence/experiments');
    return res.data;
  },

  async createExperiment(dto: Partial<IntelligenceExperiment>): Promise<IntelligenceExperiment> {
    const res = await api.post('/v1/learning-intelligence/experiments', dto);
    return res.data;
  },

  async submitExperiment(id: string): Promise<IntelligenceExperiment> {
    const res = await api.post(`/v1/learning-intelligence/experiments/${id}/submit`);
    return res.data;
  },

  async approveExperiment(id: string): Promise<IntelligenceExperiment> {
    const res = await api.post(`/v1/learning-intelligence/experiments/${id}/approve`);
    return res.data;
  },

  async startExperiment(id: string): Promise<IntelligenceExperiment> {
    const res = await api.post(`/v1/learning-intelligence/experiments/${id}/start`);
    return res.data;
  },

  async pauseExperiment(id: string): Promise<IntelligenceExperiment> {
    const res = await api.post(`/v1/learning-intelligence/experiments/${id}/pause`);
    return res.data;
  },

  async completeExperiment(id: string): Promise<IntelligenceExperiment> {
    const res = await api.post(`/v1/learning-intelligence/experiments/${id}/complete`);
    return res.data;
  },

  async getAiGovernanceMetrics(): Promise<AiGovernanceMetrics> {
    const res = await api.get('/v1/learning-intelligence/governance/ai-metrics');
    return res.data;
  },
};
