/**
 * YOUVA-EdAI: Learning Evidence & Telemetry Event Contract (LKC-0)
 * 
 * Enforces the architectural separation:
 *   KNOWLEDGE ≠ LEARNING STATE ≠ LEARNING EVIDENCE
 * 
 * Ingests granular student interactions with knowledge objects and versions.
 */

export type KnowledgeLearningEventType =
  | 'VIEWED'
  | 'STARTED'
  | 'COMPLETED'
  | 'PRACTICED'
  | 'ANSWERED'
  | 'MASTERED'
  | 'STRUGGLED'
  | 'REQUESTED_HINT'
  | 'REQUESTED_EXPLANATION';

export interface KnowledgeLearningEvent {
  id: string;

  tenantId: string;
  learnerId: string;

  knowledgeId: string;
  knowledgeVersion: number;

  eventType: KnowledgeLearningEventType;

  metadata?: Record<string, unknown>;

  occurredAt: Date;
}
