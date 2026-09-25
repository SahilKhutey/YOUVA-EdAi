export enum MetricDomain {
  LEARNER = 'LEARNER',
  LEARNING = 'LEARNING',
  CONTENT = 'CONTENT',
  ASSESSMENT = 'ASSESSMENT',
  CURRICULUM = 'CURRICULUM',
  TEACHER = 'TEACHER',
  ADAPTIVE = 'ADAPTIVE',
  AI = 'AI',
  OPERATIONAL = 'OPERATIONAL',
  GOVERNANCE = 'GOVERNANCE',
}

export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  TENANT_INTERNAL = 'TENANT_INTERNAL',
  LEARNER_CONFIDENTIAL = 'LEARNER_CONFIDENTIAL',
  RESTRICTED_EVALUATION = 'RESTRICTED_EVALUATION',
}

export enum AggregationLevel {
  INDIVIDUAL = 'INDIVIDUAL',
  CLASS = 'CLASS',
  COHORT = 'COHORT',
  TENANT = 'TENANT',
  GLOBAL = 'GLOBAL',
}

export interface MetricDefinition {
  key: string;
  name: string;
  description: string;
  domain: MetricDomain;
  source: string[];
  calculationVersion: string;
  privacyLevel: PrivacyLevel;
  aggregationLevels: AggregationLevel[];
}

export const METRIC_TAXONOMY: Record<string, MetricDefinition> = {
  MASTERY_RATE: {
    key: 'MASTERY_RATE',
    name: 'Concept Mastery Rate',
    description: 'Proportion of assigned or studied concepts where learner has demonstrated mastery >= 0.80.',
    domain: MetricDomain.LEARNER,
    source: ['LearnerKnowledgeState'],
    calculationVersion: 'mastery-rate-v1',
    privacyLevel: PrivacyLevel.LEARNER_CONFIDENTIAL,
    aggregationLevels: [AggregationLevel.INDIVIDUAL, AggregationLevel.CLASS, AggregationLevel.TENANT],
  },
  STRUGGLE_INDEX: {
    key: 'STRUGGLE_INDEX',
    name: 'Learner Struggle Index',
    description: 'Composite score derived from repeated errors, consecutive failures, and high hint dependency.',
    domain: MetricDomain.LEARNING,
    source: ['LearningEvidenceLog', 'AdaptiveDecision'],
    calculationVersion: 'struggle-index-v1',
    privacyLevel: PrivacyLevel.LEARNER_CONFIDENTIAL,
    aggregationLevels: [AggregationLevel.INDIVIDUAL, AggregationLevel.CLASS],
  },
  REMEDIATION_SUCCESS_RATE: {
    key: 'REMEDIATION_SUCCESS_RATE',
    name: 'Remediation Return-to-Target Success Rate',
    description: 'Rate at which learners in remediation restore prerequisite readiness and return to target concept.',
    domain: MetricDomain.ADAPTIVE,
    source: ['AdaptiveDecision', 'AdaptiveSession'],
    calculationVersion: 'remediation-success-v1',
    privacyLevel: PrivacyLevel.TENANT_INTERNAL,
    aggregationLevels: [AggregationLevel.CLASS, AggregationLevel.TENANT],
  },
  AI_GROUNDING_COMPLIANCE: {
    key: 'AI_GROUNDING_COMPLIANCE',
    name: 'AI Grounding Compliance Rate',
    description: 'Percentage of AI-generated responses meeting or exceeding the 0.65 grounding threshold.',
    domain: MetricDomain.AI,
    source: ['AiProvenance'],
    calculationVersion: 'grounding-compliance-v1',
    privacyLevel: PrivacyLevel.TENANT_INTERNAL,
    aggregationLevels: [AggregationLevel.TENANT, AggregationLevel.GLOBAL],
  },
  CONTENT_COMPLETION_RATE: {
    key: 'CONTENT_COMPLETION_RATE',
    name: 'Content Completion Rate',
    description: 'Proportion of sessions initiated on a knowledge object that reached completion.',
    domain: MetricDomain.CONTENT,
    source: ['KnowledgeLearningSession'],
    calculationVersion: 'completion-rate-v1',
    privacyLevel: PrivacyLevel.TENANT_INTERNAL,
    aggregationLevels: [AggregationLevel.TENANT],
  },
};
