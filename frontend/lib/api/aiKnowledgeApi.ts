import api from '../axios';

export interface AiResponseMetadata {
  model: string;
  provider: string;
  groundingScore: number;
  outputHash: string;
  generatedAt: string;
}

export interface AiResponsePayload<T = unknown> {
  requestId: string;
  capability: string;
  responseType: 'CANONICAL' | 'GROUNDED_GENERATED' | 'GENERATED' | 'ANALYTICAL_SIGNAL';
  canonical: boolean;
  requiresReview: boolean;
  data: T;
  sources: Array<{ id: string; title: string; version?: number }>;
  metadata: AiResponseMetadata;
}

export interface GeneratedQuestionDraft {
  stem: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';
  difficulty: number;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  learningObjectives: string[];
  misconceptionsTargeted?: string[];
}

export interface ContentQualityReport {
  completeness: number;
  clarity: number;
  objectiveAlignment: number;
  pedagogicalFlow: number;
  issues: Array<{
    severity: 'INFO' | 'WARNING' | 'ERROR';
    code: string;
    message: string;
  }>;
}

export const aiKnowledgeApi = {
  // =========================================================================
  // TEACHER CAPABILITIES
  // =========================================================================

  async generateExample(
    knowledgeId: string,
    instructions?: string,
  ): Promise<AiResponsePayload<{ example: string; explanation: string }>> {
    const res = await api.post('/v1/learning-knowledge/ai/generate-example', {
      knowledgeId,
      instructions,
    });
    return res.data;
  },

  async generateQuestions(
    knowledgeId: string,
    count = 3,
  ): Promise<AiResponsePayload<GeneratedQuestionDraft[]>> {
    const res = await api.post('/v1/learning-knowledge/ai/generate-questions', {
      knowledgeId,
      count,
    });
    return res.data;
  },

  async suggestObjectives(
    knowledgeId: string,
  ): Promise<AiResponsePayload<Array<{ code: string; title: string; description: string; bloomLevel: string }>>> {
    const res = await api.post('/v1/learning-knowledge/ai/suggest-objectives', {
      knowledgeId,
    });
    return res.data;
  },

  async suggestPrerequisites(
    knowledgeId: string,
  ): Promise<AiResponsePayload<Array<{ title: string; rationale: string; confidence: number }>>> {
    const res = await api.post('/v1/learning-knowledge/ai/suggest-prerequisites', {
      knowledgeId,
    });
    return res.data;
  },

  async suggestRelationships(
    knowledgeId: string,
  ): Promise<AiResponsePayload<Array<{ targetTitle: string; relationType: string; rationale: string }>>> {
    const res = await api.post('/v1/learning-knowledge/ai/suggest-relationships', {
      knowledgeId,
    });
    return res.data;
  },

  async analyzeQuality(
    knowledgeId: string,
  ): Promise<AiResponsePayload<ContentQualityReport>> {
    const res = await api.post('/v1/learning-knowledge/ai/analyze-quality', {
      knowledgeId,
    });
    return res.data;
  },

  async differentiateContent(
    knowledgeId: string,
    targetLevel: string,
  ): Promise<AiResponsePayload<{ differentiatedText: string; adjustments: string[] }>> {
    const res = await api.post('/v1/learning-knowledge/ai/differentiate', {
      knowledgeId,
      targetLevel,
    });
    return res.data;
  },

  // =========================================================================
  // STUDENT CAPABILITIES
  // =========================================================================

  async explain(
    knowledgeId: string,
    query: string,
    sectionId?: string,
  ): Promise<AiResponsePayload<{ explanation: string; followUpQuestions: string[] }>> {
    const res = await api.post('/v1/learning-knowledge/ai/explain', {
      knowledgeId,
      query,
      sectionId,
    });
    return res.data;
  },

  async hint(
    knowledgeId: string,
    questionId?: string,
    attemptCount = 1,
    expectedAnswer?: string,
  ): Promise<AiResponsePayload<{ hint: string; scaffoldLevel: 'CONCEPTUAL' | 'PROCEDURAL' | 'SETUP' }>> {
    const res = await api.post('/v1/learning-knowledge/ai/hint', {
      knowledgeId,
      questionId,
      attemptCount,
      expectedAnswer,
    });
    return res.data;
  },

  async example(
    knowledgeId: string,
    concept?: string,
  ): Promise<AiResponsePayload<{ concept: string; example: string; takeaway: string }>> {
    const res = await api.post('/v1/learning-knowledge/ai/example', {
      knowledgeId,
      concept,
    });
    return res.data;
  },

  async summarize(
    knowledgeId: string,
  ): Promise<AiResponsePayload<{ summary: string; keyPoints: string[] }>> {
    const res = await api.post('/v1/learning-knowledge/ai/summarize', {
      knowledgeId,
    });
    return res.data;
  },

  async searchAssist(
    query: string,
  ): Promise<AiResponsePayload<{ suggestions: Array<{ id: string; title: string; type: string; relevanceReason: string }> }>> {
    const res = await api.post('/v1/learning-knowledge/ai/search-assist', {
      query,
    });
    return res.data;
  },

  // =========================================================================
  // PROVENANCE & AUDIT
  // =========================================================================

  async getProvenance(id: string) {
    const res = await api.get(`/v1/learning-knowledge/ai/provenance/${id}`);
    return res.data;
  },
};
