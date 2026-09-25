export type InsightType =
  | 'LEARNER_STRUGGLE'
  | 'LEARNER_STAGNATION'
  | 'KNOWLEDGE_DIFFICULTY'
  | 'KNOWLEDGE_LOW_ENGAGEMENT'
  | 'KNOWLEDGE_HIGH_SUCCESS'
  | 'MISCONCEPTION_PATTERN'
  | 'PREREQUISITE_GAP'
  | 'CURRICULUM_GAP'
  | 'ASSESSMENT_QUALITY'
  | 'CONTENT_QUALITY'
  | 'PATH_QUALITY'
  | 'PERSONALIZATION_EFFECT'
  | 'TEACHER_WORKFLOW'
  | 'AI_QUALITY'
  | 'SYSTEM_QUALITY';

export type InsightScope =
  | 'KNOWLEDGE'
  | 'LEARNER'
  | 'CURRICULUM'
  | 'COHORT'
  | 'SYSTEM';

export type InsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InsightStatus =
  | 'DETECTED'
  | 'VALIDATING'
  | 'CONFIRMED'
  | 'ACTIONABLE'
  | 'RECOMMENDED'
  | 'ACCEPTED'
  | 'IMPLEMENTED'
  | 'EVALUATING'
  | 'RESOLVED'
  | 'DISMISSED';

export type OpportunityType =
  | 'KNOWLEDGE_REVISION'
  | 'REMEDIATION_CREATION'
  | 'PREREQUISITE_ALIGNMENT'
  | 'WORKED_EXAMPLE'
  | 'PRACTICE_SET'
  | 'PATH_ADJUSTMENT'
  | 'PERSONALIZATION_POLICY'
  | 'EXPERIMENT_CANDIDATE';

export type RecommendationAction =
  | 'REVIEW_KNOWLEDGE'
  | 'CREATE_REMEDIATION'
  | 'ADD_EXAMPLE'
  | 'ADD_PRACTICE'
  | 'REVISE_EXPLANATION'
  | 'ADD_PREREQUISITE'
  | 'REVIEW_RELATIONSHIP'
  | 'REVIEW_ASSESSMENT'
  | 'REVIEW_DIFFICULTY'
  | 'CREATE_DIFFERENTIATED_VERSION'
  | 'REVIEW_PERSONALIZATION_POLICY'
  | 'REVIEW_CURRICULUM_PATH'
  | 'RUN_EXPERIMENT';

export type RecommendationStatus =
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IMPLEMENTED'
  | 'EVALUATING'
  | 'RESOLVED'
  | 'DISMISSED';

export type AutomationLevel =
  | 'LEVEL_0_OBSERVATION'
  | 'LEVEL_1_RECOMMENDATION'
  | 'LEVEL_2_DRAFT_GENERATION'
  | 'LEVEL_3_EDUCATIONAL_CHANGE'
  | 'LEVEL_4_MASTERY_MUTATION';

export interface KnowledgeQualityProfile {
  knowledgeId: string;
  title: string;
  engagement: {
    completionRate: number;
    returnRate: number;
    abandonmentRate: number;
  };
  learning: {
    objectiveCompletionRate: number;
    masteryProgressionRate: number;
    assessmentSuccessRate: number;
  };
  support: {
    hintRate: number;
    explanationRate: number;
    remediationRate: number;
  };
  difficulty: {
    struggleRate: number;
    repeatedErrorRate: number;
  };
  confidence: number;
  sampleSize: number;
  flags: string[];
  calculatedAt: Date;
}

export interface CurriculumCoverageReport {
  curriculumId: string;
  subjectCoverage: number;
  topicCoverage: number;
  objectiveCoverage: number;
  prerequisiteCoverage: number;
  remediationCoverage: number;
  gaps: Array<{
    type: 'ORPHAN_CONCEPT' | 'MISSING_PREREQUISITE' | 'DEAD_END' | 'ABRUPT_TRANSITION';
    knowledgeId: string;
    title: string;
    description: string;
    severity: InsightSeverity;
  }>;
}

export interface LearningPathQualityReport {
  pathId: string;
  conceptIds: string[];
  completionRate: number;
  abandonmentRate: number;
  averageTimeToMasteryMinutes: number;
  remediationFrequency: number;
  bottlenecks: Array<{
    sourceKnowledgeId: string;
    targetKnowledgeId: string;
    failureRate: number;
    reason: string;
  }>;
}

export interface RecommendationOutcomeData {
  recommendationId: string;
  accepted: boolean;
  implemented: boolean;
  affectedLearners: number;
  baselineMetrics: Record<string, number>;
  postChangeMetrics: Record<string, number>;
  evaluationWindow: {
    start: Date;
    end: Date;
  };
  result: 'IMPROVED' | 'NEUTRAL' | 'REGRESSED' | 'INSUFFICIENT_DATA';
  confidence: number;
}
