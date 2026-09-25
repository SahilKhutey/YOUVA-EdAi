import { createHash } from 'crypto';

export const KNOWLEDGE_OBJECT_TYPES = [
  'SUBJECT',
  'COURSE',
  'UNIT',
  'TOPIC',
  'CONCEPT',
  'LESSON',
  'EXPLANATION',
  'EXAMPLE',
  'WORKED_EXAMPLE',
  'ACTIVITY',
  'QUESTION',
  'ASSESSMENT',
  'RESOURCE',
  'HINT',
  'REMEDIATION',
  'EXTENSION',
] as const;

export type KnowledgeObjectType = (typeof KNOWLEDGE_OBJECT_TYPES)[number];

export const KNOWLEDGE_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

export const KNOWLEDGE_EVENT_TYPES = [
  'VIEWED',
  'STARTED',
  'SECTION_VIEWED',
  'COMPLETED',
  'PRACTICED',
  'ANSWERED',
  'REQUESTED_HINT',
  'REQUESTED_EXPLANATION',
  'STRUGGLED',
  'MASTERED',
] as const;

export type KnowledgeEventType = (typeof KNOWLEDGE_EVENT_TYPES)[number];

export const KNOWLEDGE_RELATIONS = [
  'PREREQUISITE',
  'PART_OF',
  'CONTAINS',
  'RELATED_TO',
  'BUILDS_ON',
  'CONTRASTS_WITH',
  'EXAMPLE_OF',
  'ASSESSED_BY',
  'REMEDIATED_BY',
  'EXTENDS_TO',
] as const;

export type KnowledgeRelationType = (typeof KNOWLEDGE_RELATIONS)[number];

/**
 * Computes deterministic SHA-256 hash of knowledge content for version integrity and deduplication.
 */
export function hashKnowledgeContent(content: string): string {
  return createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}
