export type PatternStatus = 'CANDIDATE' | 'VALIDATED' | 'REVALIDATING' | 'EXPIRED';

export interface LearningPatternDto {
  id: string;
  tenantId?: string;
  patternKey: string;
  type?: string;
  statement?: string;
  conceptScope: string;
  evidenceCount: number;
  effectiveness?: number;
  confidence?: number;
  sourceVersion: string;
  methodologyVersion?: string;
  status: PatternStatus;
  createdAt: Date;
  updatedAt: Date;
}
