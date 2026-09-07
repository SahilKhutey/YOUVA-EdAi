export interface TopicMasterySnapshot {
  topicId: string;
  topicTitle?: string;
  subjectName?: string;
  mastery: number; // 0.0 - 1.0
  certifiedByTeacher: boolean;
  certifiedAt?: string;
  lastEvidenceAt?: string;
}

export interface CognitiveTwinSnapshot {
  workingMemory: number; // 0.0 - 1.0
  processingSpeed: number; // 0.0 - 1.0
  fatigueIndex: number; // 0.0 - 1.0
  focusIndex: number; // 0.0 - 1.0
  inferredState: string; // 'flow' | 'fatigue' | 'confusion' | 'deep_understanding'
  updatedTimestamp?: string;
}

export interface SafetyAndConsentBoundary {
  parentConsentGranted: boolean;
  restrictedDataProcessing: boolean;
  activeEscalationSeverity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  openEscalationCount: number;
  hasActiveTeacherIntervention: boolean;
}

export interface TeacherOverrideSnapshot {
  interventionId: string;
  teacherId: string;
  topicId?: string;
  mandatedDifficulty?: number;
  mandatedModality?: string;
  customPacing?: string;
  teacherNotes?: string;
  appliedAt: string;
}

export interface UnifiedLearnerState {
  studentId: string;
  studentName?: string;
  cognitiveLevel: string; // CHILD | TEEN | ADULT
  gradeLevel?: string | null;
  tenantId?: string | null;

  // Holistic domain vectors
  masteryVector: Record<string, TopicMasterySnapshot>;
  overallAverageMastery: number;
  cognitiveProfile: CognitiveTwinSnapshot;
  safetyAndConsent: SafetyAndConsentBoundary;
  activeTeacherOverrides: Record<string, TeacherOverrideSnapshot>;

  // Goals & Telemetry
  activeGoals: Array<{
    id: string;
    title: string;
    targetScore?: number;
    currentProgress?: number;
  }>;
  learningLoopTelemetry: {
    recentAccuracy: number;
    errorClusterScore: number;
    streakDays: number;
  };

  generatedAt: string;
}

export interface ReadinessEvaluationResult {
  ready: boolean;
  effectiveDifficulty: number;
  mandatedModality?: string;
  reason: string;
  isTeacherOverridden: boolean;
  safetyHalted: boolean;
}
