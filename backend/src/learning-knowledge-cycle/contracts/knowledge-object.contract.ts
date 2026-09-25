/**
 * YOUVA-EdAI: Canonical Knowledge Object & Version Contract (LKC-0)
 * 
 * Defines the single canonical identity for all educational knowledge objects
 * across curriculum, teacher authoring, student learning, AI, and graph representations.
 */

export type KnowledgeObjectType =
  | 'SUBJECT'
  | 'COURSE'
  | 'UNIT'
  | 'TOPIC'
  | 'CONCEPT'
  | 'LESSON'
  | 'EXPLANATION'
  | 'EXAMPLE'
  | 'WORKED_EXAMPLE'
  | 'ACTIVITY'
  | 'QUESTION'
  | 'ASSESSMENT'
  | 'RESOURCE'
  | 'HINT'
  | 'REMEDIATION'
  | 'EXTENSION';

export type KnowledgeObjectStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface KnowledgeObject {
  id: string;
  tenantId: string;

  type: KnowledgeObjectType;

  title: string;
  slug: string;

  description?: string;

  parentId?: string;

  subjectId?: string;
  courseId?: string;
  unitId?: string;
  topicId?: string;

  learningObjectives: string[];

  prerequisites: string[];

  tags: string[];

  difficulty?: number;

  status: KnowledgeObjectStatus;

  currentVersion: number;

  createdBy: string;
  updatedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeSourceType =
  | 'TEACHER'
  | 'AI'
  | 'IMPORTED'
  | 'SYSTEM';

export type VersionReviewStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface KnowledgeVersion {
  id: string;

  knowledgeObjectId: string;

  version: number;

  content: Record<string, unknown>;

  contentHash: string;

  authorId: string;

  sourceType: KnowledgeSourceType;

  reviewStatus: VersionReviewStatus;

  createdAt: Date;
  publishedAt?: Date;
}
