export type InstitutionalScope = 'CLASS' | 'SCHOOL' | 'DISTRICT';

export type InstitutionalSignalType =
  | 'MASTERY_DECLINE'
  | 'INTERVENTION_BACKLOG'
  | 'CONTENT_FAILURE'
  | 'ASSESSMENT_ANOMALY'
  | 'TEACHER_WORKLOAD'
  | 'ENGAGEMENT_CHANGE';

export interface InstitutionalSignal {
  tenantId: string;
  scope: InstitutionalScope;
  type: InstitutionalSignalType;
  score: number;
  sampleSize: number;
  confidence: number;
}

/**
 * Privacy preservation gate:
 * Prevents small cohort de-anonymization (k-anonymity threshold).
 */
export function canShowAggregate(
  sampleSize: number,
  minimum: number = 10,
): boolean {
  return sampleSize >= minimum;
}
