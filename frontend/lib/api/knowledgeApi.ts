import api from '../axios';
import {
  KnowledgeObjectItem,
  KnowledgeVersionItem,
  TeacherDashboardStats,
  KnowledgeRelationshipItem,
  StudentKnowledgeDetail,
  KnowledgeLearningSessionItem,
  EvaluateAnswerInput,
  EvaluateAnswerResult,
  KnowledgeEventInput,
  KnowledgeSearchResponse,
  LearningPath,
  GraphHealthMetrics,
  GraphValidationResult,
} from '../../types/knowledge';

export interface CreateKnowledgePayload {
  type: string;
  title: string;
  slug: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  parentId?: string;
  content: string;
  learningObjectives: string[];
  prerequisites: string[];
  tags?: string[];
}

export interface UpdateKnowledgePayload {
  title?: string;
  description?: string;
  content: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

export const knowledgeApi = {
  /**
   * Fetches teacher's knowledge library and stats.
   */
  async getTeacherKnowledge(): Promise<{
    stats: TeacherDashboardStats;
    items: KnowledgeObjectItem[];
  }> {
    const res = await api.get('/v1/learning-knowledge/teacher');
    return res.data;
  },

  /**
   * Fetches full detail of a knowledge object for teacher editing.
   */
  async getTeacherKnowledgeDetail(id: string): Promise<KnowledgeObjectItem> {
    const res = await api.get(`/v1/learning-knowledge/teacher/${id}`);
    return res.data;
  },

  /**
   * Creates a draft knowledge object with initial version v1.
   */
  async createKnowledge(data: CreateKnowledgePayload): Promise<KnowledgeObjectItem> {
    const res = await api.post('/v1/learning-knowledge', data);
    return res.data;
  },

  /**
   * Updates knowledge object, creating version N + 1 and resetting status to DRAFT.
   */
  async updateKnowledge(
    id: string,
    data: UpdateKnowledgePayload,
  ): Promise<KnowledgeObjectItem> {
    const res = await api.patch(`/v1/learning-knowledge/teacher/${id}`, data);
    return res.data;
  },

  /**
   * Submits a DRAFT knowledge object for review (DRAFT -> IN_REVIEW).
   */
  async submitForReview(id: string): Promise<KnowledgeObjectItem> {
    const res = await api.post(`/v1/learning-knowledge/teacher/${id}/submit`);
    return res.data;
  },

  /**
   * Approves a knowledge version (IN_REVIEW -> APPROVED).
   */
  async approveKnowledge(id: string): Promise<KnowledgeObjectItem> {
    const res = await api.post(`/v1/learning-knowledge/teacher/${id}/approve`);
    return res.data;
  },

  /**
   * Publishes an approved knowledge version (APPROVED -> PUBLISHED).
   */
  async publishKnowledge(id: string, notes?: string): Promise<KnowledgeObjectItem> {
    const res = await api.post(`/v1/learning-knowledge/teacher/${id}/publish`, { notes });
    return res.data;
  },

  /**
   * Fetches version history for an object.
   */
  async getVersions(id: string): Promise<KnowledgeVersionItem[]> {
    const res = await api.get(`/v1/learning-knowledge/teacher/${id}/versions`);
    return res.data;
  },

  /**
   * Creates a semantic relationship between two knowledge objects.
   */
  async createRelationship(data: {
    sourceId: string;
    targetId: string;
    relation: string;
    weight?: number;
  }): Promise<KnowledgeRelationshipItem> {
    const res = await api.post('/v1/learning-knowledge/relationships', data);
    return res.data;
  },

  /**
   * Fetches published knowledge for student consumption.
   */
  async getStudentKnowledge(id: string): Promise<StudentKnowledgeDetail> {
    const res = await api.get(`/v1/learning-knowledge/${id}`);
    return res.data;
  },

  /**
   * Searches published knowledge items for students.
   */
  async searchStudentKnowledge(params?: {
    query?: string;
    type?: string;
    subjectId?: string;
    topicId?: string;
    page?: number;
    limit?: number;
  }): Promise<KnowledgeSearchResponse> {
    const res = await api.get('/v1/learning-knowledge', { params });
    return res.data;
  },

  /**
   * Fetches related knowledge items for an object.
   */
  async getRelated(id: string): Promise<{
    outgoing: Array<{ id: string; title: string; type: string; relation: string; weight: number }>;
    incoming: Array<{ id: string; title: string; type: string; relation: string; weight: number }>;
  }> {
    const res = await api.get(`/v1/learning-knowledge/${id}/related`);
    return res.data;
  },

  /**
   * Fetches prerequisites for a knowledge object.
   */
  async getPrerequisites(id: string): Promise<Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    weight: number;
  }>> {
    const res = await api.get(`/v1/learning-knowledge/${id}/prerequisites`);
    return res.data;
  },

  /**
   * Starts or resumes a student learning session.
   */
  async startSession(
    knowledgeObjectId: string,
    data?: { knowledgeVersionId?: string },
  ): Promise<KnowledgeLearningSessionItem> {
    const res = await api.post(`/v1/learning-knowledge/${knowledgeObjectId}/sessions`, data || {});
    return res.data;
  },

  /**
   * Gets a student learning session by ID.
   */
  async getSession(sessionId: string): Promise<KnowledgeLearningSessionItem> {
    const res = await api.get(`/v1/learning-knowledge/sessions/${sessionId}`);
    return res.data;
  },

  /**
   * Updates progress position in a learning session.
   */
  async updateSessionPosition(
    sessionId: string,
    lastPosition: number,
  ): Promise<KnowledgeLearningSessionItem> {
    const res = await api.patch(`/v1/learning-knowledge/sessions/${sessionId}`, { lastPosition });
    return res.data;
  },

  /**
   * Marks a learning session as COMPLETED.
   */
  async completeSession(sessionId: string): Promise<KnowledgeLearningSessionItem> {
    const res = await api.post(`/v1/learning-knowledge/sessions/${sessionId}/complete`);
    return res.data;
  },

  /**
   * Submits an answer for server-side evaluation.
   */
  async evaluateAnswer(data: EvaluateAnswerInput): Promise<EvaluateAnswerResult> {
    const res = await api.post('/v1/learning-knowledge/evaluate-answer', data);
    return res.data;
  },

  /**
   * Records a granular learning event.
   */
  async recordEvent(data: KnowledgeEventInput): Promise<any> {
    const res = await api.post('/v1/learning-knowledge/events', data);
    return res.data;
  },

  /**
   * Generates a personalized learning path with prerequisite readiness.
   */
  async getLearningPath(id: string, courseId?: string): Promise<LearningPath> {
    const res = await api.get(`/v1/learning-knowledge/${id}/path`, {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },

  /**
   * Retrieves downstream concepts that depend on this knowledge object.
   */
  async getDependents(id: string, depth?: number): Promise<any[]> {
    const res = await api.get(`/v1/learning-knowledge/${id}/dependents`, {
      params: depth ? { depth } : undefined,
    });
    return res.data;
  },

  /**
   * Fetches graph health and governance metrics.
   */
  async getGraphHealth(): Promise<GraphHealthMetrics> {
    const res = await api.get('/v1/learning-knowledge/graph/health');
    return res.data;
  },

  /**
   * Validates a relationship before creation.
   */
  async validateRelationship(data: {
    sourceId: string;
    targetId: string;
    relation: string;
  }): Promise<GraphValidationResult> {
    const res = await api.post('/v1/learning-knowledge/relationships/validate', data);
    return res.data;
  },

  /**
   * Fetches full subgraph around a concept for visualization.
   */
  async getSubgraph(id: string, depth: number = 2): Promise<{ nodes: any[]; edges: any[] }> {
    const res = await api.get(`/v1/knowledge-graph/${id}/subgraph`, {
      params: { depth },
    });
    return res.data;
  },
};
