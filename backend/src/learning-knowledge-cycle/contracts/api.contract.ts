/**
 * YOUVA-EdAI: Production API Contracts (LKC-0)
 * 
 * Defines the public learning, teacher authoring, evidence ingestion,
 * and governance API request and response shapes.
 */

import {
  KnowledgeObject,
  KnowledgeObjectType,
  KnowledgeVersion,
} from './knowledge-object.contract';
import { KnowledgeLearningEventType } from './learning-event.contract';
import { KnowledgeRelation } from './knowledge-relationship.contract';

// ============================================================================
// 1. STUDENT RETRIEVAL CONTRACT
// ============================================================================

export interface StudentKnowledgeResponse {
  id: string;
  type: KnowledgeObjectType;
  title: string;
  version: number;
  content: Record<string, unknown>;
  learningObjectives: string[];
  prerequisites: Array<{
    id: string;
    title: string;
    type: KnowledgeObjectType;
  }>;
  relatedKnowledge: Array<{
    id: string;
    title: string;
    relation: KnowledgeRelation;
  }>;
  recommendedNext: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
}

// ============================================================================
// 2. TEACHER API CONTRACTS
// ============================================================================

export interface CreateKnowledgeDto {
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
  prerequisites?: string[];
  tags?: string[];
  difficulty?: number;
  initialContent?: Record<string, unknown>;
}

export interface UpdateKnowledgeDto {
  title?: string;
  description?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  tags?: string[];
  difficulty?: number;
  content?: Record<string, unknown>;
  changeSummary?: string;
}

export interface TeacherKnowledgeSummary {
  id: string;
  type: KnowledgeObjectType;
  title: string;
  slug: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
  draftChangesPending: boolean;
}

export interface TeacherDashboardStats {
  draftsCount: number;
  inReviewCount: number;
  publishedCount: number;
  needsAttentionCount: number;
}

// ============================================================================
// 3. EVIDENCE INGESTION CONTRACT
// ============================================================================

export interface SubmitLearningEventDto {
  tenantId: string;
  learnerId: string;
  knowledgeId: string;
  knowledgeVersion: number;
  eventType: KnowledgeLearningEventType;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface SubmitEvidenceDto {
  tenantId: string;
  learnerId: string;
  knowledgeId: string;
  knowledgeVersion: number;
  interactionType: 'QUESTION' | 'EXERCISE' | 'ACTIVITY';
  isCorrect?: boolean;
  score?: number;
  latencyMs?: number;
  hintsUsed?: number;
  detectedMisconceptionCode?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 4. GOVERNANCE CONTRACTS
// ============================================================================

export interface SubmitForReviewDto {
  notes?: string;
}

export interface ReviewDecisionDto {
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  reviewerNotes: string;
}

export interface ArchiveKnowledgeDto {
  reason: string;
}
