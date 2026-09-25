import { OutcomeClassification } from './outcome';

export interface GuardrailEvaluationResult {
  metric: string;
  baselineValue: number;
  observedValue: number;
  delta: number;
  acceptableTolerance: number;
  passed: boolean;
}

export interface PlanEvaluationReport {
  planId: string;
  tenantId: string;
  primaryMetric: string;
  baselineValue: number;
  observedValue: number;
  delta: number;
  sampleSize: number;
  classification: OutcomeClassification;
  guardrailResults: GuardrailEvaluationResult[];
  allGuardrailsPassed: boolean;
  canStandardize: boolean;
  requiresReopen: boolean;
  evaluatedAt: Date;
  summary: string;
}
