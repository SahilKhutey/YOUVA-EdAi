export type OutcomeStatus = 'INSUFFICIENT_DATA' | 'EVALUATING' | 'MEASURED';

export type OutcomeClassification =
  | 'POSITIVE_SIGNAL'
  | 'NO_CLEAR_CHANGE'
  | 'NEGATIVE_SIGNAL'
  | 'MIXED_RESULT'
  | 'INSUFFICIENT_DATA';

export interface ImprovementOutcomeDto {
  id: string;
  tenantId: string;
  planId: string;
  metric: string;
  baselineValue: number;
  observedValue: number;
  delta: number;
  sampleSize: number;
  confidence?: number;
  status: OutcomeStatus;
  classification?: OutcomeClassification;
  windowStart: Date;
  windowEnd: Date;
  createdAt: Date;
}
