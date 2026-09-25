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

export interface EvolutionEvaluationDto {
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
  createdAt: Date;
}

export interface ImprovementCandidateDto {
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
  createdAt: Date;
  updatedAt: Date;
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

export interface LearningExperimentDto {
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
  createdAt: Date;
  updatedAt: Date;
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

export interface MethodologyVersionDto {
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
  createdAt: Date;
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

export interface LearningDriftSignalDto {
  id: string;
  tenantId: string;
  targetType: string;
  targetId: string;
  driftType: DriftType;
  baselineWindow: { start: string; end: string };
  comparisonWindow: { start: string; end: string };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceIds: string[];
  createdAt: Date;
}

export interface EvolutionMemoryDto {
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
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface CreateEvolutionMemoryDto {
  tenantId?: string;
  changeType: string;
  sourceIds: string[];
  baseline: any;
  intervention: any;
  outcome: any;
  learning: string[];
  limitations?: string[];
  confidence?: string;
  methodologyVersion?: string;
  expiresAt?: Date;
}

export interface RollbackPlanDto {
  targetVersion: string;
  previousVersion: string;
  rollbackTrigger: string;
  rollbackSteps: string[];
  validationSteps: string[];
  ownerRole: string;
}

export interface EvolutionRolloutDto {
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
  rollbackPlan?: RollbackPlanDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvolutionPolicyDto {
  changeType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evolutionLevel: EvolutionLevel;
  simulationRequired: boolean;
  assuranceRequired: boolean;
  approvalRequired: boolean;
  minimumEvidence: number;
  rollbackRequired: boolean;
  canAutoExecute: boolean;
}
