import api from '../axios';

export type EvolutionLevel = 0 | 1 | 2 | 3 | 4;

export type CandidateSourceType =
  | 'INSIGHT'
  | 'PATTERN'
  | 'EVALUATION'
  | 'DRIFT'
  | 'USER_FEEDBACK'
  | 'MODEL_ERROR'
  | 'OPERATIONS';

export type CandidateStatus =
  | 'DISCOVERED'
  | 'VALIDATING'
  | 'SIMULATION_REQUIRED'
  | 'REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED';

export type ExperimentStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'STOPPED';

export type MethodologyStatus =
  | 'EXPERIMENTAL'
  | 'OFFLINE_VALIDATED'
  | 'SHADOW'
  | 'CANARY'
  | 'ACTIVE'
  | 'DEPRECATED';

export type DriftType =
  | 'INPUT'
  | 'OUTPUT'
  | 'PERFORMANCE'
  | 'CALIBRATION'
  | 'DATA_QUALITY';

export type MemoryStatus =
  | 'DISCOVERED'
  | 'VALIDATED'
  | 'ACTIVE'
  | 'REVALIDATING'
  | 'STALE'
  | 'ARCHIVED';

export type RolloutStage =
  | 'SHADOW'
  | 'CANARY_5'
  | 'STAGE_15'
  | 'STAGE_30'
  | 'PRODUCTION_100';

export interface EvaluationMetric {
  name: string;
  value: number;
  unit?: string;
}

export interface EvaluationDelta {
  metric: string;
  baseline: number;
  actual: number;
  delta: number;
  pctChange: number;
}

export interface SuccessCriterion {
  metric: string;
  targetDelta: number;
  comparator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
  satisfied?: boolean;
}

export interface EvolutionEvaluation {
  id: string;
  tenantId: string;
  interventionId: string;
  baseline: EvaluationMetric[];
  actual: EvaluationMetric[];
  deltas: EvaluationDelta[];
  successCriteria: SuccessCriterion[];
  methodologyVersion: string;
  evidenceIds: string[];
  limitations: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'INCONCLUSIVE';
  createdAt: string;
}

export interface ImprovementCandidate {
  id: string;
  tenantId: string;
  sourceType: CandidateSourceType;
  sourceIds: string[];
  targetType: string;
  targetId: string;
  proposal: any;
  expectedBenefits: string[];
  risks: string[];
  assumptions: string[];
  evolutionLevel: EvolutionLevel;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImprovementCandidateDto {
  tenantId?: string;
  sourceType: CandidateSourceType;
  sourceIds: string[];
  targetType: string;
  targetId: string;
  proposal: any;
  expectedBenefits?: string[];
  risks?: string[];
  assumptions?: string[];
  evolutionLevel?: EvolutionLevel;
}

export interface LearningExperiment {
  id: string;
  tenantId: string;
  hypothesis: string;
  baselineDefinition: any;
  treatmentDefinition: any;
  populationDefinition: any;
  successMetrics: string[];
  guardrails: string[];
  methodologyVersion: string;
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperimentDto {
  tenantId?: string;
  hypothesis: string;
  baselineDefinition: any;
  treatmentDefinition: any;
  populationDefinition: any;
  successMetrics: string[];
  guardrails?: string[];
  methodologyVersion?: string;
}

export interface MethodologyVersion {
  id: string;
  tenantId?: string | null;
  name: string;
  version: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  assumptions: string[];
  limitations: string[];
  evaluationMetrics: string[];
  status: MethodologyStatus;
  createdAt: string;
}

export interface CreateMethodologyDto {
  tenantId?: string;
  name: string;
  version: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  assumptions?: string[];
  limitations?: string[];
  evaluationMetrics?: string[];
  status?: MethodologyStatus;
}

export interface LearningDriftSignal {
  id: string;
  tenantId: string;
  targetType: string;
  targetId: string;
  driftType: DriftType;
  baselineWindow: { start: string; end: string };
  comparisonWindow: { start: string; end: string };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceIds: string[];
  createdAt: string;
}

export interface EvolutionMemory {
  id: string;
  tenantId: string;
  changeType: string;
  sourceIds: string[];
  baseline: any;
  intervention: any;
  outcome: any;
  learning: string[];
  limitations: string[];
  confidence: string;
  methodologyVersion: string;
  status: MemoryStatus;
  createdAt: string;
  expiresAt?: string | null;
}

export interface RollbackPlan {
  targetVersion: string;
  previousVersion: string;
  rollbackTrigger: string;
  rollbackSteps: string[];
  validationSteps: string[];
  ownerRole: string;
}

export interface EvolutionRollout {
  id: string;
  tenantId: string;
  candidateId: string;
  targetType: string;
  targetId: string;
  currentStage: RolloutStage;
  percentage: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ROLLED_BACK';
  guardrailBreached: boolean;
  rollbackReason?: string | null;
  rollbackPlan?: RollbackPlan | null;
  createdAt: string;
  updatedAt: string;
}

export const continuousLearningApi = {
  // Evaluations
  createEvaluation: async (dto: any): Promise<EvolutionEvaluation> => {
    const res = await api.post<EvolutionEvaluation>('/api/v1/continuous-learning/evaluations', dto);
    return res.data;
  },
  listEvaluations: async (tenantId?: string): Promise<EvolutionEvaluation[]> => {
    const res = await api.get<EvolutionEvaluation[]>('/api/v1/continuous-learning/evaluations', {
      params: { tenantId },
    });
    return res.data;
  },
  getEvaluation: async (id: string): Promise<EvolutionEvaluation> => {
    const res = await api.get<EvolutionEvaluation>(`/api/v1/continuous-learning/evaluations/${id}`);
    return res.data;
  },

  // Improvement Candidates
  createCandidate: async (dto: CreateImprovementCandidateDto): Promise<ImprovementCandidate> => {
    const res = await api.post<ImprovementCandidate>('/api/v1/continuous-learning/improvements', dto);
    return res.data;
  },
  listCandidates: async (params?: {
    tenantId?: string;
    status?: CandidateStatus;
  }): Promise<ImprovementCandidate[]> => {
    const res = await api.get<ImprovementCandidate[]>('/api/v1/continuous-learning/improvements', {
      params,
    });
    return res.data;
  },
  getCandidate: async (id: string): Promise<ImprovementCandidate> => {
    const res = await api.get<ImprovementCandidate>(`/api/v1/continuous-learning/improvements/${id}`);
    return res.data;
  },
  validateCandidate: async (id: string) => {
    const res = await api.post(`/api/v1/continuous-learning/improvements/${id}/validate`);
    return res.data;
  },
  simulateCandidate: async (id: string) => {
    const res = await api.post(`/api/v1/continuous-learning/improvements/${id}/simulate`);
    return res.data;
  },
  approveCandidate: async (id: string, actorRole?: string): Promise<ImprovementCandidate> => {
    const res = await api.post<ImprovementCandidate>(
      `/api/v1/continuous-learning/improvements/${id}/approve`,
      { actorRole },
    );
    return res.data;
  },
  rejectCandidate: async (id: string, reason?: string): Promise<ImprovementCandidate> => {
    const res = await api.post<ImprovementCandidate>(
      `/api/v1/continuous-learning/improvements/${id}/reject`,
      { reason },
    );
    return res.data;
  },

  // Experiments
  createExperiment: async (dto: CreateExperimentDto): Promise<LearningExperiment> => {
    const res = await api.post<LearningExperiment>('/api/v1/continuous-learning/experiments', dto);
    return res.data;
  },
  listExperiments: async (params?: {
    tenantId?: string;
    status?: ExperimentStatus;
  }): Promise<LearningExperiment[]> => {
    const res = await api.get<LearningExperiment[]>('/api/v1/continuous-learning/experiments', {
      params,
    });
    return res.data;
  },
  getExperiment: async (id: string): Promise<LearningExperiment> => {
    const res = await api.get<LearningExperiment>(`/api/v1/continuous-learning/experiments/${id}`);
    return res.data;
  },
  startExperiment: async (id: string, actorRole?: string): Promise<LearningExperiment> => {
    const res = await api.post<LearningExperiment>(
      `/api/v1/continuous-learning/experiments/${id}/start`,
      { actorRole },
    );
    return res.data;
  },
  pauseExperiment: async (id: string, reason?: string): Promise<LearningExperiment> => {
    const res = await api.post<LearningExperiment>(
      `/api/v1/continuous-learning/experiments/${id}/pause`,
      { reason },
    );
    return res.data;
  },
  stopExperiment: async (id: string, reason?: string): Promise<LearningExperiment> => {
    const res = await api.post<LearningExperiment>(
      `/api/v1/continuous-learning/experiments/${id}/stop`,
      { reason },
    );
    return res.data;
  },
  completeExperiment: async (id: string): Promise<LearningExperiment> => {
    const res = await api.post<LearningExperiment>(
      `/api/v1/continuous-learning/experiments/${id}/complete`,
    );
    return res.data;
  },

  // Methodologies
  createMethodology: async (dto: CreateMethodologyDto): Promise<MethodologyVersion> => {
    const res = await api.post<MethodologyVersion>('/api/v1/continuous-learning/methodologies', dto);
    return res.data;
  },
  listMethodologies: async (params?: {
    tenantId?: string;
    status?: MethodologyStatus;
  }): Promise<MethodologyVersion[]> => {
    const res = await api.get<MethodologyVersion[]>('/api/v1/continuous-learning/methodologies', {
      params,
    });
    return res.data;
  },
  getMethodology: async (id: string): Promise<MethodologyVersion> => {
    const res = await api.get<MethodologyVersion>(
      `/api/v1/continuous-learning/methodologies/${id}`,
    );
    return res.data;
  },
  promoteMethodology: async (
    id: string,
    targetStatus: MethodologyStatus,
  ): Promise<MethodologyVersion> => {
    const res = await api.post<MethodologyVersion>(
      `/api/v1/continuous-learning/methodologies/${id}/promote`,
      { targetStatus },
    );
    return res.data;
  },
  deprecateMethodology: async (id: string): Promise<MethodologyVersion> => {
    const res = await api.post<MethodologyVersion>(
      `/api/v1/continuous-learning/methodologies/${id}/deprecate`,
    );
    return res.data;
  },
  runShadowComparison: async (body: {
    activeMethodologyId: string;
    candidateMethodologyId: string;
    input: any;
  }) => {
    const res = await api.post(
      '/api/v1/continuous-learning/methodologies/shadow-compare',
      body,
    );
    return res.data;
  },

  // Drift
  detectDrift: async (body: any): Promise<LearningDriftSignal | null> => {
    const res = await api.post<LearningDriftSignal | null>(
      '/api/v1/continuous-learning/drift/detect',
      body,
    );
    return res.data;
  },
  listDriftSignals: async (params?: {
    tenantId?: string;
    driftType?: DriftType;
  }): Promise<LearningDriftSignal[]> => {
    const res = await api.get<LearningDriftSignal[]>('/api/v1/continuous-learning/drift', {
      params,
    });
    return res.data;
  },
  getDriftSignal: async (id: string): Promise<LearningDriftSignal> => {
    const res = await api.get<LearningDriftSignal>(`/api/v1/continuous-learning/drift/${id}`);
    return res.data;
  },

  // Rollouts & Rollback
  startRollout: async (body: {
    tenantId?: string;
    candidateId: string;
    targetType: string;
    targetId: string;
    rollbackPlan?: RollbackPlan;
  }): Promise<EvolutionRollout> => {
    const res = await api.post<EvolutionRollout>('/api/v1/continuous-learning/rollouts', body);
    return res.data;
  },
  listRollouts: async (tenantId?: string): Promise<EvolutionRollout[]> => {
    const res = await api.get<EvolutionRollout[]>('/api/v1/continuous-learning/rollouts', {
      params: { tenantId },
    });
    return res.data;
  },
  getRollout: async (id: string): Promise<EvolutionRollout> => {
    const res = await api.get<EvolutionRollout>(`/api/v1/continuous-learning/rollouts/${id}`);
    return res.data;
  },
  advanceRollout: async (
    id: string,
    guardrailsSatisfied?: boolean,
  ): Promise<EvolutionRollout> => {
    const res = await api.post<EvolutionRollout>(
      `/api/v1/continuous-learning/rollouts/${id}/advance`,
      { guardrailsSatisfied },
    );
    return res.data;
  },
  pauseRollout: async (id: string, reason?: string): Promise<EvolutionRollout> => {
    const res = await api.post<EvolutionRollout>(
      `/api/v1/continuous-learning/rollouts/${id}/pause`,
      { reason },
    );
    return res.data;
  },
  rollback: async (id: string, reason: string): Promise<EvolutionRollout> => {
    const res = await api.post<EvolutionRollout>(
      `/api/v1/continuous-learning/rollouts/${id}/rollback`,
      { reason },
    );
    return res.data;
  },

  // Evolution Memory
  createMemory: async (dto: any): Promise<EvolutionMemory> => {
    const res = await api.post<EvolutionMemory>('/api/v1/continuous-learning/memory', dto);
    return res.data;
  },
  listMemories: async (params?: {
    tenantId?: string;
    status?: MemoryStatus;
  }): Promise<EvolutionMemory[]> => {
    const res = await api.get<EvolutionMemory[]>('/api/v1/continuous-learning/memory', {
      params,
    });
    return res.data;
  },
  getMemory: async (id: string): Promise<EvolutionMemory> => {
    const res = await api.get<EvolutionMemory>(`/api/v1/continuous-learning/memory/${id}`);
    return res.data;
  },
  revalidateMemory: async (id: string): Promise<EvolutionMemory> => {
    const res = await api.post<EvolutionMemory>(
      `/api/v1/continuous-learning/memory/${id}/revalidate`,
    );
    return res.data;
  },
};
