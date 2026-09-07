export type StudyDesign = 'RANDOMIZED' | 'QUASI_EXPERIMENTAL' | 'OBSERVATIONAL';

export interface CausalStudyDto {
  hypothesis: string;
  treatment: string;
  control?: string;
  outcome: string;
  population: Record<string, unknown>;
  confounders: string[];
  design: StudyDesign;
}

export interface InterventionEffectivenessDto {
  interventionType: string;
  conceptId?: string;
  sampleSize: number;
  baselineMastery: number;
  postMastery: number;
  retention?: number;
  transfer?: number;
  effectSize?: number;
  confidence?: number;
}
