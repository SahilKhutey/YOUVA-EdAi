import api from '../axios';

export interface SystemicInsight {
  id: string;
  tenantId: string;
  type: string;
  title: string;
  summary: string;
  confidence: number;
  status: 'DETECTED' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';
  affectedCourses: string[];
  affectedLearnerCount: number;
  evidenceReferences: string[];
  detectedAt: string;
  createdAt: string;
}

export interface LearningPattern {
  id: string;
  patternKey: string;
  type?: string;
  statement?: string;
  conceptScope: string;
  evidenceCount: number;
  effectiveness?: number;
  confidence?: number;
  sourceVersion: string;
  methodologyVersion?: string;
  status: 'CANDIDATE' | 'VALIDATED' | 'REVALIDATING' | 'EXPIRED';
  createdAt: string;
}

export interface LearningMemory {
  id: string;
  memoryType: string;
  statement: string;
  confidence: number;
  status: 'ACTIVE' | 'REVALIDATING' | 'EXPIRED' | 'SUPERSEDED';
  evidenceReferences: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface LearningBenchmark {
  id: string;
  metric: string;
  scope: string;
  populationDefinition: any;
  periodStart: string;
  periodEnd: string;
  value: number;
  sampleSize: number;
  methodologyVersion: string;
  createdAt: string;
}

export interface SystemicAction {
  id: string;
  type: string;
  targetCourseIds: string[];
  targetKnowledgeIds: string[];
  description: string;
  status: 'PENDING' | 'EXECUTED';
}

export interface SystemOptimizationPlan {
  id: string;
  objective: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED';
  policyVersion: string;
  ownerId: string;
  approvedBy?: string;
  actions: SystemicAction[];
  createdAt: string;
}

export interface InstitutionalOverview {
  insightsCount: number;
  patternsCount: number;
  activeMemoriesCount: number;
  optimizationPlansCount: number;
  lastUpdated: string;
  dataWindow: {
    start: string;
    end: string;
  };
  systemStatus: {
    crossEntityPipeline: string;
    patternEngine: string;
    learningMemory: string;
    benchmarking: string;
  };
}

export interface NetworkNode {
  id: string;
  type: 'CONCEPT' | 'PREREQUISITE' | 'ASSESSMENT' | 'INTERVENTION' | 'OUTCOME';
  label: string;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  relation: string;
}

export interface BoundedNetworkGraph {
  rootId: string;
  depth: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export const institutionalIntelligenceApi = {
  getOverview: async (): Promise<InstitutionalOverview> => {
    const res = await api.get('/api/v1/institutional-intelligence/overview');
    return res.data;
  },

  listInsights: async (status?: string): Promise<SystemicInsight[]> => {
    const res = await api.get('/api/v1/institutional-intelligence/insights', {
      params: { status },
    });
    return res.data;
  },

  getInsight: async (id: string): Promise<SystemicInsight> => {
    const res = await api.get(`/api/v1/institutional-intelligence/insights/${id}`);
    return res.data;
  },

  createInsight: async (dto: Partial<SystemicInsight>): Promise<SystemicInsight> => {
    const res = await api.post('/api/v1/institutional-intelligence/insights', dto);
    return res.data;
  },

  listPatterns: async (status?: string): Promise<LearningPattern[]> => {
    const res = await api.get('/api/v1/institutional-intelligence/patterns', {
      params: { status },
    });
    return res.data;
  },

  listMemories: async (): Promise<LearningMemory[]> => {
    const res = await api.get('/api/v1/institutional-intelligence/memories');
    return res.data;
  },

  createMemory: async (dto: Partial<LearningMemory>): Promise<LearningMemory> => {
    const res = await api.post('/api/v1/institutional-intelligence/memories', dto);
    return res.data;
  },

  getNetwork: async (rootId = 'root', depth = 2): Promise<BoundedNetworkGraph> => {
    const res = await api.get('/api/v1/institutional-intelligence/network', {
      params: { rootId, depth },
    });
    return res.data;
  },

  queryBenchmarks: async (query: {
    metric?: string;
    scope?: string;
    userRole?: string;
  }): Promise<LearningBenchmark[]> => {
    const res = await api.post('/api/v1/institutional-intelligence/benchmarks/query', {
      userRole: query.userRole || 'ADMIN',
      ...query,
    });
    return res.data;
  },

  listOptimizationPlans: async (): Promise<SystemOptimizationPlan[]> => {
    const res = await api.get('/api/v1/institutional-intelligence/optimization/plans');
    return res.data;
  },

  createOptimizationPlan: async (dto: Partial<SystemOptimizationPlan>): Promise<SystemOptimizationPlan> => {
    const res = await api.post('/api/v1/institutional-intelligence/optimization/plans', dto);
    return res.data;
  },

  approveOptimizationPlan: async (id: string, approvedBy = 'admin'): Promise<SystemOptimizationPlan> => {
    const res = await api.post(`/api/v1/institutional-intelligence/optimization/plans/${id}/approve`, {
      approvedBy,
    });
    return res.data;
  },

  executeOptimizationPlan: async (id: string): Promise<SystemOptimizationPlan> => {
    const res = await api.post(`/api/v1/institutional-intelligence/optimization/plans/${id}/execute`);
    return res.data;
  },
};
