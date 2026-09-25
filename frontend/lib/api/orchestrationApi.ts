import api from '../axios';

export type AdaptiveActionType =
  | 'CONTINUE'
  | 'REVIEW'
  | 'PRACTICE'
  | 'REMEDIATE'
  | 'EXPLAIN'
  | 'HINT'
  | 'EXAMPLE'
  | 'REATTEMPT'
  | 'ADVANCE'
  | 'EXTEND'
  | 'REINFORCE'
  | 'REFLECT'
  | 'PAUSE'
  | 'TEACHER_INTERVENTION';

export type AdaptiveReasonCode =
  | 'LOW_MASTERY'
  | 'LOW_CONFIDENCE'
  | 'PREREQUISITE_NOT_READY'
  | 'REPEATED_ERROR'
  | 'MISCONCEPTION_SIGNAL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'RECENT_FAILURE'
  | 'REVIEW_DUE'
  | 'ASSIGNMENT_REQUIRED'
  | 'CURRICULUM_SEQUENCE'
  | 'READY_TO_ADVANCE'
  | 'EXTENSION_AVAILABLE'
  | 'TEACHER_DIRECTED'
  | 'LEARNER_REQUESTED_SUPPORT'
  | 'SESSION_RESUME'
  | 'KNOWLEDGE_COMPLETED';

export interface AdaptiveLearningAction {
  id: string;
  learnerId: string;
  tenantId: string;
  sourceKnowledgeId?: string;
  sourceKnowledgeVersionId?: string;
  targetKnowledgeId: string;
  targetKnowledgeVersionId?: string;
  targetTitle?: string;
  action: AdaptiveActionType;
  reasonCode: AdaptiveReasonCode;
  reasonMessage: string;
  priority: number;
  confidence: number;
  required: boolean;
  expiresAt?: string;
  decisionId: string;
  policyVersion: string;
  createdAt: string;
}

export interface AdaptiveSessionContext {
  sessionId: string;
  learnerId: string;
  tenantId: string;
  currentKnowledgeId?: string;
  currentVersionId?: string;
  currentAction?: AdaptiveActionType;
  startedAt: string;
  lastInteractionAt?: string;
  interventionLevel: number;
  remediationDepth: number;
  remediationTargetId?: string;
  actionsTaken: string[];
}

export interface TeacherLearnerAdaptiveView {
  learnerId: string;
  session: AdaptiveSessionContext;
  currentAction: AdaptiveActionType;
  reasonCode: AdaptiveReasonCode;
  reasonMessage: string;
  interventionLevel: number;
  activeOverride?: {
    id: string;
    action: string;
    targetKnowledgeId?: string;
    reason?: string;
    createdAt: string;
  };
  recentMastery: Array<{
    knowledgeId: string;
    title: string;
    type: string;
    masteryLevel: number;
    confidence: number;
    status: string;
  }>;
}

export const orchestrationApi = {
  /**
   * Primary student endpoint: get the next recommended learning action.
   */
  async getNext(currentKnowledgeId?: string): Promise<AdaptiveLearningAction> {
    const res = await api.get('/v1/learning-orchestration/next', {
      params: currentKnowledgeId ? { currentKnowledgeId } : {},
    });
    return res.data;
  },

  /**
   * Retrieves active adaptive session context for the learner.
   */
  async getContext(): Promise<AdaptiveSessionContext> {
    const res = await api.get('/v1/learning-orchestration/context');
    return res.data;
  },

  /**
   * Retrieves decision record by ID for diagnostics and audit.
   */
  async getDecision(id: string): Promise<any> {
    const res = await api.get(`/v1/learning-orchestration/decisions/${id}`);
    return res.data;
  },

  /**
   * Triggers an adaptive recalculation.
   */
  async recalculate(
    currentKnowledgeId?: string,
    triggerEvent?: string,
  ): Promise<AdaptiveLearningAction> {
    const res = await api.post('/v1/learning-orchestration/recalculate', {
      currentKnowledgeId,
      triggerEvent,
    });
    return res.data;
  },

  /**
   * Marks an adaptive action as completed.
   */
  async completeAction(actionId: string): Promise<{ status: string }> {
    const res = await api.post(`/v1/learning-orchestration/actions/${actionId}/complete`);
    return res.data;
  },

  /**
   * Skips an adaptive action.
   */
  async skipAction(actionId: string): Promise<{ status: string }> {
    const res = await api.post(`/v1/learning-orchestration/actions/${actionId}/skip`);
    return res.data;
  },

  /**
   * Teacher view of a learner's adaptive status, recent mastery, and active overrides.
   */
  async getTeacherLearnerView(learnerId: string): Promise<TeacherLearnerAdaptiveView> {
    const res = await api.get(`/v1/learning-orchestration/teacher/learners/${learnerId}`);
    return res.data;
  },

  /**
   * Teacher override on learner's adaptive progression.
   */
  async teacherOverride(
    learnerId: string,
    action: string,
    targetKnowledgeId?: string,
    reason?: string,
  ): Promise<any> {
    const res = await api.post('/v1/learning-orchestration/teacher/override', {
      learnerId,
      action,
      targetKnowledgeId,
      reason,
    });
    return res.data;
  },
};
