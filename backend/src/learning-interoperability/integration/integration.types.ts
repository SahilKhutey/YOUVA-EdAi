export interface LearningProviderEvent {
  externalEventId: string;
  providerId: string;
  tenantId?: string;
  learnerReference: string;
  eventType: 'ACTIVITY_COMPLETED' | 'ASSESSMENT_COMPLETED' | 'CREDENTIAL_ISSUED';
  occurredAt: string;
  payload: Record<string, any>;
  signature?: string;
}

export interface LearningDataContract<T> {
  schema: string;
  version: number;
  eventId: string;
  occurredAt: string;
  producer: string;
  payload: T;
}

/**
 * Validates whether an incoming event contract version is supported by the consumer.
 */
export function isSupportedVersion(version: number, supported: number[]): boolean {
  return supported.includes(version);
}

export interface NormalizedEvidence {
  source: string;
  conceptId: string;
  performance: number;
  confidence: number;
  occurredAt: string;
  originalReference: string;
}

export interface LearningAIContext {
  learnerId: string;
  currentConcept?: {
    id: string;
    mastery: number;
  };
  recentEvidence: any[];
  activeGoal?: any;
  teacherInstructions?: string[];
  safetyFlags: {
    requiresReview: boolean;
  };
  allowedActions: string[];
}

export interface ContextPolicy {
  includeMastery: boolean;
  includeRecentEvidence: boolean;
  includeTeacherInstructions: boolean;
  includeGoals: boolean;
  includePreferences: boolean;
  maxEvidenceItems: number;
}
