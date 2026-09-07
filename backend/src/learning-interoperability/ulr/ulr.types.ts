export interface MasterySummary {
  conceptId: string;
  conceptName: string;
  score: number;
  confidence: number;
  lastAssessedAt: string;
}

export interface ConceptSummary {
  id: string;
  name: string;
  subject: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
}

export interface CompetencySummary {
  competencyId: string;
  key: string;
  name: string;
  level: string;
  confidence: number;
  evidenceCount: number;
}

export interface EvidenceSummary {
  id: string;
  source: string;
  conceptId: string;
  performance: number;
  confidence: number;
  occurredAt: string;
}

export interface LearningGoalSummary {
  id: string;
  title: string;
  targetDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'ABANDONED';
}

export interface InterventionSummary {
  id: string;
  type: string;
  conceptId?: string;
  status: string;
  timestamp: string;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  score: number;
  completedAt: string;
}

export interface CredentialSummary {
  id: string;
  title: string;
  achievementType: string;
  issuer: string;
  issuedAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface LearningPreference {
  key: string;
  value: string | number | boolean;
}

export interface AccessibilityProfile {
  highContrast?: boolean;
  screenReaderOptimized?: boolean;
  fontScale?: number;
  audioPacing?: 'NORMAL' | 'SLOW' | 'FAST';
  captionsEnabled?: boolean;
}

export interface UnifiedLearnerRecord {
  learnerId: string;

  identity: {
    ageTier: string;
    tenantId: string;
  };

  learning: {
    mastery: MasterySummary[];
    concepts: ConceptSummary[];
    competencies: CompetencySummary[];
  };

  evidence: {
    recent: EvidenceSummary[];
    confidence: number;
  };

  goals: LearningGoalSummary[];

  interventions: InterventionSummary[];

  assessments: AssessmentSummary[];

  credentials: CredentialSummary[];

  preferences: LearningPreference[];

  accessibility: AccessibilityProfile;

  provenance: {
    generatedAt: string;
    sourceVersions: string[];
  };
}

export function nextSnapshotVersion(current: number | null): number {
  return current === null ? 1 : current + 1;
}
