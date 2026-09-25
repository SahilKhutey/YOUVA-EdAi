export type LineageRelation =
  | 'DERIVED_FROM'
  | 'INFORMED_BY'
  | 'CREATED_FROM'
  | 'EVALUATED_BY'
  | 'CHANGED_BY';

export interface LearningLineageDto {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relation: LineageRelation;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface KnowledgeEvolutionNode {
  versionId: string;
  version: number;
  publishedAt?: Date;
  authorId: string;
  sourceType: string;
  learnerCount: number;
  derivedFromVersionId?: string;
  sourceInsightIds: string[];
  sourceRecommendationIds: string[];
  sourcePlanId?: string;
  aiAssisted: boolean;
  evaluationStatus?: string;
  primaryMetricDelta?: string;
}

export interface KnowledgeEvolutionTree {
  knowledgeObjectId: string;
  title: string;
  currentVersion: number;
  versions: KnowledgeEvolutionNode[];
}

export interface OptimizationOverviewDto {
  activePlansCount: number;
  evaluationsRunningCount: number;
  completedImprovementsCount: number;
  reopenedImprovementsCount: number;
  systemStatus: {
    evidencePipeline: string;
    intelligenceEngine: string;
    optimizationWorkers: string;
    evaluationWorkers: string;
  };
}
