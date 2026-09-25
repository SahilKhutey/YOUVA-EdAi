export type ScenarioOperation =
  | 'ADD'
  | 'REMOVE'
  | 'MOVE'
  | 'REPLACE'
  | 'MODIFY'
  | 'ENABLE'
  | 'DISABLE';

export interface ScenarioChange {
  targetType: string;
  targetId: string;
  operation: ScenarioOperation;
  proposedState: any;
}

export type ConstraintType =
  | 'MAX_WORKLOAD'
  | 'MIN_MASTERY'
  | 'ASSESSMENT_REQUIREMENT'
  | 'TEACHER_CAPACITY'
  | 'CURRICULUM_REQUIREMENT'
  | 'POLICY'
  | 'SECURITY';

export interface ScenarioConstraint {
  type: ConstraintType;
  value: any;
}

export type ScenarioStatus =
  | 'DRAFT'
  | 'SIMULATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ARCHIVED'
  | 'APPROVED'
  | 'REJECTED';

export type UncertaintyLevel = 'OBSERVED' | 'SIMULATED' | 'ESTIMATED' | 'UNKNOWN';

export interface ScenarioMetrics {
  affectedLearners: number;
  affectedCourses: number;
  prerequisiteConflicts: number;
  assessmentConflicts: number;
  estimatedTeacherWorkloadDeltaPct: number;
  estimatedRemediationDemandDeltaPct: number;
}

export interface ScenarioImpact {
  category: string;
  targetId: string;
  description: string;
  delta: string;
  uncertainty: UncertaintyLevel;
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProbabilityBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface ScenarioRisk {
  category: string;
  severity: RiskSeverity;
  probabilityBand: ProbabilityBand;
  affectedEntities: number;
  explanation: string;
  evidenceIds: string[];
}

export type ConflictType =
  | 'VERSION_CONFLICT'
  | 'PREREQUISITE_CONFLICT'
  | 'ASSESSMENT_CONFLICT'
  | 'POLICY_CONFLICT'
  | 'WORKLOAD_CONFLICT'
  | 'SECURITY_CONFLICT'
  | 'WORKFLOW_CONFLICT';

export interface ScenarioConflict {
  type: ConflictType;
  targetId: string;
  severity: string;
  explanation: string;
}

export interface TwinSnapshotDto {
  id: string;
  tenantId: string;
  snapshotTime: Date;
  knowledgeVersionSet: string;
  curriculumVersionSet: string;
  policyVersionSet: string;
  learnerStateSnapshot: string;
  assessmentVersionSet: string;
  methodologyVersion: string;
  checksum: string;
  createdAt: Date;
}

export interface LearningScenarioDto {
  id: string;
  tenantId: string;
  snapshotId: string;
  name: string;
  objective: string;
  changes: ScenarioChange[];
  constraints?: ScenarioConstraint[] | null;
  status: ScenarioStatus;
  methodologyVersion?: string | null;
  createdAt: Date;
  updatedAt: Date;
  results?: SimulationResultDto[];
  snapshot?: TwinSnapshotDto;
}

export interface SimulationResultDto {
  id: string;
  scenarioId: string;
  baseline: ScenarioMetrics;
  projected: ScenarioMetrics;
  impacts: ScenarioImpact[];
  risks: ScenarioRisk[];
  conflicts: ScenarioConflict[];
  assumptions: string[];
  limitations: string[];
  methodologyVersion: string;
  createdAt: Date;
}

export interface MetricComparison {
  metric: string;
  baseline: number | string;
  scenario: number | string;
  delta: number | string;
  unit?: string;
}

export interface ScenarioComparisonDto {
  baselineScenarioId?: string;
  scenarioId: string;
  metrics: MetricComparison[];
  impacts: ScenarioImpact[];
  conflicts: ScenarioConflict[];
  assumptions: string[];
  limitations: string[];
}

export interface TwinLearner {
  learnerId: string;
  mastery: Record<string, number>;
  confidence: Record<string, number>;
  currentPath: string[];
  activeAssignments: string[];
}

export interface CreateSnapshotDto {
  tenantId?: string;
  knowledgeVersionSet?: string;
  curriculumVersionSet?: string;
  policyVersionSet?: string;
  learnerStateSnapshot?: string;
  assessmentVersionSet?: string;
  methodologyVersion?: string;
}

export interface CreateScenarioDto {
  tenantId?: string;
  snapshotId: string;
  name: string;
  objective: string;
  changes: ScenarioChange[];
  constraints?: ScenarioConstraint[];
  methodologyVersion?: string;
}
