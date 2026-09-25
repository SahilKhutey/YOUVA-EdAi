import api from '../axios';
import { KnowledgeObjectType } from '../../types/knowledge';

export interface PersonalizedRecommendation {
  decisionId: string;
  learnerId: string;
  tenantId: string;
  decisionType: 'CONTINUE' | 'REVIEW' | 'REMEDIATE' | 'PRACTICE' | 'ADVANCE' | 'EXTEND';
  targetKnowledge: {
    id: string;
    title: string;
    type: KnowledgeObjectType;
    slug?: string;
  };
  sourceKnowledgeId?: string;
  reason: {
    code: string;
    message: string;
  };
  confidence: number;
  policyVersion: string;
  createdAt: string;
}

export interface LearnerKnowledgeStateItem {
  id: string;
  tenantId: string;
  learnerId: string;
  knowledgeObjectId: string;
  masteryLevel: number;
  confidence: number;
  status: 'NOT_STARTED' | 'LEARNING' | 'STRUGGLING' | 'DEVELOPING' | 'MASTERED' | 'NEEDS_REVIEW';
  attempts: number;
  correctAttempts: number;
  streakCount: number;
  struggleScore: number;
  lastActivityAt?: string | null;
  lastEvidenceAt?: string | null;
  nextReviewAt?: string | null;
  knowledgeObject?: {
    id: string;
    title: string;
    type: KnowledgeObjectType;
    currentVersion: number;
  };
}

export interface TeacherKnowledgeAnalytics {
  knowledgeObjectId: string;
  totalStudentsEngaged: number;
  averageMastery: number;
  statusDistribution: {
    NOT_STARTED: number;
    LEARNING: number;
    STRUGGLING: number;
    DEVELOPING: number;
    MASTERED: number;
    NEEDS_REVIEW: number;
  };
  strugglingStudentsCount: number;
}

export const personalizationApi = {
  /**
   * Fetches deterministic next recommended learning action.
   */
  async getNextRecommendation(currentKnowledgeId?: string): Promise<PersonalizedRecommendation> {
    const res = await api.get('/v1/personalization/next', {
      params: { currentKnowledgeId },
    });
    return res.data;
  },

  /**
   * Fetches all canonical knowledge mastery states for the authenticated student.
   */
  async getMyKnowledgeStates(): Promise<LearnerKnowledgeStateItem[]> {
    const res = await api.get('/v1/learner-state');
    return res.data;
  },

  /**
   * Fetches learner state for a specific canonical knowledge object.
   */
  async getKnowledgeState(knowledgeObjectId: string): Promise<LearnerKnowledgeStateItem> {
    const res = await api.get(`/v1/learner-state/knowledge/${knowledgeObjectId}`);
    return res.data;
  },

  /**
   * Fetches teacher class-level analytics on a knowledge object.
   */
  async getTeacherAnalytics(knowledgeObjectId: string): Promise<TeacherKnowledgeAnalytics> {
    const res = await api.get(`/v1/learner-state/teacher/${knowledgeObjectId}/analytics`);
    return res.data;
  },
};
