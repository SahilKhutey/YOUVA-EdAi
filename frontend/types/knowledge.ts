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

export type KnowledgeStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type KnowledgeRelationType =
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

export type ContentBlock =
  | {
      type: 'TEXT';
      id: string;
      content: string;
    }
  | {
      type: 'HEADING';
      id: string;
      level: 1 | 2 | 3;
      content: string;
    }
  | {
      type: 'IMAGE';
      id: string;
      assetId?: string;
      url?: string;
      altText: string;
    }
  | {
      type: 'EXAMPLE';
      id: string;
      title: string;
      content: string;
    }
  | {
      type: 'QUESTION';
      id: string;
      questionId?: string;
      prompt: string;
      options?: string[];
      answer?: string;
    }
  | {
      type: 'ACTIVITY';
      id: string;
      activityId?: string;
      title: string;
      instructions: string;
    }
  | {
      type: 'CALLOUT';
      id: string;
      title?: string;
      content: string;
      variant?: 'NOTE' | 'TIP' | 'WARNING';
    };

export interface LessonSection {
  id: string;
  title: string;
  sectionType: 'INTRO' | 'OBJECTIVES' | 'PREREQUISITES' | 'EXPOSITION' | 'EXAMPLE' | 'ACTIVITY' | 'PRACTICE' | 'SUMMARY';
  blocks: ContentBlock[];
}

export interface StructuredLessonContent {
  summary?: string;
  sections: LessonSection[];
}

export interface KnowledgeObjectiveItem {
  id?: string;
  objective: string;
  sequence?: number;
}

export interface KnowledgeTagItem {
  id?: string;
  tag: string;
}

export interface KnowledgeRelationshipItem {
  id?: string;
  sourceId?: string;
  targetId?: string;
  relation: KnowledgeRelationType;
  weight?: number;
  target?: {
    id: string;
    title: string;
    type: KnowledgeObjectType;
  };
  source?: {
    id: string;
    title: string;
    type: KnowledgeObjectType;
  };
}

export interface KnowledgeVersionItem {
  id: string;
  version: number;
  content: string;
  contentHash: string;
  sourceType: 'TEACHER' | 'AI' | 'IMPORTED' | 'SYSTEM';
  reviewStatus: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  authorId: string;
  createdAt: string;
  publishedAt?: string;
}

export interface KnowledgeObjectItem {
  id: string;
  tenantId?: string;
  type: KnowledgeObjectType;
  title: string;
  slug: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  parentId?: string;
  status: KnowledgeStatus;
  currentVersion: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  objectives?: KnowledgeObjectiveItem[];
  tags?: KnowledgeTagItem[];
  versions?: KnowledgeVersionItem[];
  outgoingLinks?: KnowledgeRelationshipItem[];
  incomingLinks?: KnowledgeRelationshipItem[];
}

export interface TeacherDashboardStats {
  drafts: number;
  inReview: number;
  approved: number;
  published: number;
  total: number;
}

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StudentKnowledgeDetail {
  id: string;
  type: KnowledgeObjectType;
  title: string;
  slug: string;
  description?: string;
  version: number;
  knowledgeVersionId: string;
  content: string;
  learningObjectives: string[];
  tags: string[];
  prerequisites: Array<{
    id: string;
    title: string;
    type: KnowledgeObjectType;
  }>;
  relatedKnowledge: Array<{
    id: string;
    title: string;
    relation: string;
  }>;
}

export interface KnowledgeLearningSessionItem {
  id: string;
  tenantId: string;
  learnerId: string;
  knowledgeObjectId: string;
  knowledgeVersionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  lastPosition: number;
  startedAt: string;
  completedAt?: string | null;
  updatedAt: string;
  knowledgeObject?: {
    id: string;
    title: string;
    type: KnowledgeObjectType;
  };
}

export interface EvaluateAnswerInput {
  knowledgeObjectId: string;
  knowledgeVersion: number;
  questionId: string;
  submittedAnswer: string;
  attempt?: number;
  latencyMs?: number;
  hintUsed?: boolean;
  clientEventId?: string;
}

export interface EvaluateAnswerResult {
  isCorrect: boolean;
  feedback: string;
  explanation?: string;
}

export interface KnowledgeEventInput {
  knowledgeObjectId: string;
  knowledgeVersion: number;
  eventType: string;
  clientEventId?: string;
  metadata?: string;
}

export interface KnowledgeSearchResponse {
  items: Array<{
    id: string;
    type: KnowledgeObjectType;
    title: string;
    slug: string;
    description?: string;
    version: number;
    tags: string[];
    learningObjectives: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LearningPathRole =
  | 'CURRENT'
  | 'PREREQUISITE'
  | 'REMEDIATION'
  | 'NEXT'
  | 'EXTENSION';

export type LearningPathReadiness = 'READY' | 'PARTIALLY_READY' | 'NOT_READY';

export interface LearningPathNode {
  knowledgeId: string;
  title: string;
  type: string;
  role: LearningPathRole;
  mastery?: number;
  confidence?: number;
  status?: string;
  required: boolean;
  reason?: string;
  sequence?: number;
}

export interface LearningPath {
  targetKnowledgeId: string;
  targetTitle: string;
  nodes: LearningPathNode[];
  readiness: LearningPathReadiness;
  weakestPrerequisiteId?: string;
  generatedAt: string;
}

export interface GraphHealthMetrics {
  totalNodes: number;
  totalRelationships: number;
  prerequisiteRelationships: number;
  brokenRelationships: number;
  potentialCycles: number;
  orphanNodes: number;
  unpublishedReferences: number;
  warnings: string[];
}

export interface GraphValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

