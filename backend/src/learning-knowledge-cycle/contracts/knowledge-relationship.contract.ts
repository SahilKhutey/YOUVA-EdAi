/**
 * YOUVA-EdAI: Knowledge Relationship Contract (LKC-0)
 * 
 * Establishes the canonical vocabulary for semantic knowledge edges across
 * curriculum structure, graph engines, and adaptive remediation.
 */

export type KnowledgeRelation =
  | 'PREREQUISITE'
  | 'PART_OF'
  | 'CONTAINS'
  | 'RELATED_TO'
  | 'BUILDS_ON'
  | 'CONTRASTS_WITH'
  | 'EXAMPLE_OF'
  | 'ASSESSED_BY'
  | 'REMEDIATED_BY'
  | 'EXTENDS_TO';

export interface KnowledgeRelationship {
  id: string;

  tenantId: string;

  sourceId: string;
  targetId: string;

  relation: KnowledgeRelation;

  weight?: number;

  createdBy: string;

  createdAt: Date;
}
