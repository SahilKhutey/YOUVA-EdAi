export type BenchmarkScope = 'INSTITUTION' | 'DEPARTMENT' | 'GRADE_LEVEL';

export interface PopulationDefinition {
  gradeLevels?: string[];
  departments?: string[];
  subjects?: string[];
  minimumMastery?: number;
  sampleRatio?: number;
}

export interface LearningBenchmarkDto {
  id: string;
  tenantId: string;
  metric: string;
  scope: BenchmarkScope;
  populationDefinition: PopulationDefinition;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  sampleSize: number;
  methodologyVersion: string;
  createdAt: Date;
}
