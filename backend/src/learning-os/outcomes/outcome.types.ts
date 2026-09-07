export interface OutcomeInput {
  baselineMastery: number;
  finalMastery: number;
  retentionScore?: number;
  transferScore?: number;
  independence?: number;
}

export interface RecordOutcomeDto {
  tenantId: string;
  learnerId: string;
  conceptId: string;
  interventionId?: string;
  experimentId?: string;
  baselineMastery: number;
  finalMastery: number;
  retentionScore?: number;
  transferScore?: number;
  independence?: number;
}

export interface Benchmark {
  metric: string;
  populationSize: number;
  mean: number;
  median: number;
  percentile25: number;
  percentile75: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}
