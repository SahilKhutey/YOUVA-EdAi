import { Role } from '../../auth/role.enum';

export enum AiCapability {
  GENERATE_EXAMPLE = 'GENERATE_EXAMPLE',
  GENERATE_WORKED_EXAMPLE = 'GENERATE_WORKED_EXAMPLE',
  GENERATE_QUESTION = 'GENERATE_QUESTION',
  GENERATE_EXPLANATION = 'GENERATE_EXPLANATION',
  GENERATE_HINT = 'GENERATE_HINT',
  GENERATE_SUMMARY = 'GENERATE_SUMMARY',

  SUGGEST_OBJECTIVES = 'SUGGEST_OBJECTIVES',
  SUGGEST_PREREQUISITES = 'SUGGEST_PREREQUISITES',
  SUGGEST_RELATIONSHIPS = 'SUGGEST_RELATIONSHIPS',

  DETECT_MISCONCEPTION = 'DETECT_MISCONCEPTION',
  DIFFERENTIATE = 'DIFFERENTIATE',

  QUALITY_ANALYSIS = 'QUALITY_ANALYSIS',
  SEARCH_ASSIST = 'SEARCH_ASSIST',
}

export interface AiCapabilityPolicy {
  capability: AiCapability;
  roles: Role[];
  requiresPublishedKnowledge: boolean;
  requiresTeacherReview: boolean;
  allowsLearnerContext: boolean;
}

export const AI_CAPABILITY_POLICIES: Record<AiCapability, AiCapabilityPolicy> = {
  [AiCapability.GENERATE_EXAMPLE]: {
    capability: AiCapability.GENERATE_EXAMPLE,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.GENERATE_WORKED_EXAMPLE]: {
    capability: AiCapability.GENERATE_WORKED_EXAMPLE,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.GENERATE_QUESTION]: {
    capability: AiCapability.GENERATE_QUESTION,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.GENERATE_EXPLANATION]: {
    capability: AiCapability.GENERATE_EXPLANATION,
    roles: [Role.STUDENT, Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: true,
    requiresTeacherReview: false,
    allowsLearnerContext: true,
  },
  [AiCapability.GENERATE_HINT]: {
    capability: AiCapability.GENERATE_HINT,
    roles: [Role.STUDENT, Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: true,
    requiresTeacherReview: false,
    allowsLearnerContext: true,
  },
  [AiCapability.GENERATE_SUMMARY]: {
    capability: AiCapability.GENERATE_SUMMARY,
    roles: [Role.STUDENT, Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: true,
    requiresTeacherReview: false,
    allowsLearnerContext: false,
  },
  [AiCapability.SUGGEST_OBJECTIVES]: {
    capability: AiCapability.SUGGEST_OBJECTIVES,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.SUGGEST_PREREQUISITES]: {
    capability: AiCapability.SUGGEST_PREREQUISITES,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.SUGGEST_RELATIONSHIPS]: {
    capability: AiCapability.SUGGEST_RELATIONSHIPS,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.DETECT_MISCONCEPTION]: {
    capability: AiCapability.DETECT_MISCONCEPTION,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: true,
  },
  [AiCapability.DIFFERENTIATE]: {
    capability: AiCapability.DIFFERENTIATE,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: true,
  },
  [AiCapability.QUALITY_ANALYSIS]: {
    capability: AiCapability.QUALITY_ANALYSIS,
    roles: [Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: false,
    requiresTeacherReview: true,
    allowsLearnerContext: false,
  },
  [AiCapability.SEARCH_ASSIST]: {
    capability: AiCapability.SEARCH_ASSIST,
    roles: [Role.STUDENT, Role.TEACHER, Role.ADMIN],
    requiresPublishedKnowledge: true,
    requiresTeacherReview: false,
    allowsLearnerContext: true,
  },
};

export interface RetrievedKnowledgeItem {
  id: string;
  versionId?: string;
  title: string;
  type: string;
  status: string;
  content: string;
  relationToTarget?: string;
  relevanceScore?: number;
}

export interface AiContext {
  tenantId: string;
  targetKnowledge: RetrievedKnowledgeItem;
  prerequisites?: RetrievedKnowledgeItem[];
  relatedKnowledge?: RetrievedKnowledgeItem[];
  learnerState?: {
    masteryLevel: number;
    confidence: number;
    status: string;
    recentErrors?: string[];
  };
}

export interface AiGenerationMetadata {
  requestId: string;
  tenantId: string;
  actorId: string;
  capability: AiCapability;
  model: string;
  provider: string;
  promptVersion: string;
  sourceKnowledgeIds: string[];
  sourceVersionIds: string[];
  outputHash: string;
  groundingScore?: number;
  safetyStatus?: string;
  generatedAt: Date;
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

export interface MisconceptionSignal {
  misconceptionCode: string;
  description: string;
  confidence: number;
  remediationRecommendation: string;
}

export interface ContentQualityReport {
  completeness: number; // 0.0 - 1.0
  clarity: number; // 0.0 - 1.0
  objectiveAlignment: number; // 0.0 - 1.0
  pedagogicalFlow: number; // 0.0 - 1.0
  issues: Array<{
    severity: 'INFO' | 'WARNING' | 'ERROR';
    code: string;
    message: string;
  }>;
}

export type AiResponseType =
  | 'CANONICAL'
  | 'GROUNDED_GENERATED'
  | 'GENERATED'
  | 'ANALYTICAL_SIGNAL';

export interface AiResponsePayload<T = unknown> {
  requestId: string;
  capability: AiCapability;
  responseType: AiResponseType;
  canonical: boolean;
  requiresReview: boolean;
  data: T;
  sources: Array<{ id: string; title: string; version?: number }>;
  metadata: {
    model: string;
    provider: string;
    groundingScore: number;
    outputHash: string;
    generatedAt: Date;
  };
}
