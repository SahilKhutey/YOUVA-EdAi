import { KnowledgeRelation } from '../../learning-knowledge-cycle/contracts/knowledge-relationship.contract';
import { KnowledgeObjectType, KnowledgeObjectStatus } from '../../learning-knowledge-cycle/contracts/knowledge-object.contract';

export interface KnowledgeNode {
  id: string;
  title: string;
  type: KnowledgeObjectType | string;
  status: KnowledgeObjectStatus | string;
  slug?: string;
  description?: string;
  difficulty?: number;
  currentVersion?: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: KnowledgeRelation | string;
  weight?: number;
  source?: KnowledgeNode;
  target?: KnowledgeNode;
}

export interface GraphTraversalOptions {
  maxDepth: number;
  relationTypes?: (KnowledgeRelation | string)[];
  publishedOnly?: boolean;
  tenantId?: string;
}

export type LearningPathRole =
  | 'CURRENT'
  | 'PREREQUISITE'
  | 'REMEDIATION'
  | 'NEXT'
  | 'EXTENSION';

export type LearningPathReadiness = 'READY' | 'PARTIALLY_READY' | 'NOT_READY';

export interface LearningPathNode {
  knowledgeId: string;
  title: string;
  type: string;
  role: LearningPathRole;
  mastery?: number;
  confidence?: number;
  status?: string;
  required: boolean;
  reason?: string;
  sequence?: number;
}

export interface LearningPath {
  targetKnowledgeId: string;
  targetTitle: string;
  nodes: LearningPathNode[];
  readiness: LearningPathReadiness;
  weakestPrerequisiteId?: string;
  generatedAt: Date;
}

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GraphHealthMetrics {
  totalNodes: number;
  totalRelationships: number;
  prerequisiteRelationships: number;
  brokenRelationships: number;
  potentialCycles: number;
  orphanNodes: number;
  unpublishedReferences: number;
  warnings: string[];
}
