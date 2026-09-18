export type AgeBand = 'PRESCHOOL' | 'ELEMENTARY' | 'MIDDLE' | 'HIGH_SCHOOL';

export interface AgeExperiencePolicy {
  ageBand: AgeBand;
  targetAgeRange: string;
  navigationMode: 'VISUAL_LARGE_TARGETS' | 'HYBRID_GUIDED' | 'STANDARD_DASHBOARD';
  interactionMode: 'VOICE_FIRST' | 'TOUCH_VOICE_MULTIMODAL' | 'DESKTOP_KEYBOARD';
  languageComplexity: 'CONCRETE_SIMPLE' | 'ELEMENTARY_PROGRESSIVE' | 'ANALYTICAL';
  autonomyLevel: 'PARENT_SUPERVISED' | 'EDUCATOR_COACHED' | 'SELF_DIRECTED';
  safetyPolicyVersion: string;
  assessmentPolicyVersion: string;
  maxSessionMinutes: number;
  gamificationBanned: boolean;
}

export type ChildConsentStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'WITHDRAWN'
  | 'REVOKED';

export interface ChildConsentRecord {
  consentId: string;
  learnerId: string;
  parentId: string;
  tenantId: string;
  status: ChildConsentStatus;
  requestedAt: string;
  verifiedAt?: string;
  withdrawnAt?: string;
  scopes: string[]; // e.g. ['VOICE_INTERACTION', 'OFFLINE_TASKS', 'LEARNING_TELEMETRY']
  jurisdiction: string; // e.g. 'DPDP-IN', 'COPPA-US', 'GDPR-K'
  verificationMethod: 'OTP' | 'DIGITAL_SIGNATURE' | 'GOV_ID';
  auditLog: Array<{
    timestamp: string;
    action: string;
    actorId: string;
  }>;
}

export type ChildSafetyCategory =
  | 'SELF_HARM'
  | 'ABUSE'
  | 'EXPLOITATION'
  | 'BULLYING'
  | 'SEXUAL_SAFETY'
  | 'VIOLENCE'
  | 'DANGEROUS_ACTIVITY'
  | 'PRIVACY_RISK'
  | 'UNSAFE_ADVICE'
  | 'OTHER';

export type ChildSafetySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChildSafetyIncident {
  incidentId: string;
  learnerId: string;
  tenantId: string;
  category: ChildSafetyCategory;
  severity: ChildSafetySeverity;
  triggerContext: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string; // Must be verified human, never AI
  resolutionStatus: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED';
  escalationRecipients: string[]; // ['PARENT', 'TEACHER', 'SAFEGUARDING_OFFICER']
  resolutionRationale?: string;
}

export interface PreschoolActivity {
  activityId: string;
  title: string;
  domain: 'LITERACY' | 'NUMERACY' | 'STORY' | 'MUSIC' | 'MOVEMENT' | 'SEL';
  description: string;
  audioPromptUrl?: string;
  visualCue: string;
  interactionType: 'VOICE' | 'TOUCH_CHOICE' | 'PHYSICAL_TASK';
  learningObjective: string;
  isPhysicalWorldTask: boolean;
}

export interface ElementaryLesson {
  lessonId: string;
  title: string;
  subject: 'MATHEMATICS' | 'SCIENCE' | 'READING' | 'CODING_FOUNDATIONS' | 'AI_LITERACY';
  level: number; // 1 - 5
  concept: string;
  interactiveChallenge: {
    prompt: string;
    codeSnippet?: string;
    options?: string[];
    expectedAnswer: string;
  };
}

export interface ParentLearnerLink {
  linkId: string;
  parentId: string;
  learnerId: string;
  relationshipType: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN';
  status: 'ACTIVE' | 'REVOKED';
  verifiedAt: string;
}

export interface ParentCoPilotSummary {
  learnerId: string;
  learnerName: string;
  ageBand: AgeBand;
  learningTimeMinutes: number;
  completedActivitiesCount: number;
  humanReadableProgress: string; // Jargon-free text
  suggestedHomeSupport: string[];
  safetyAlertsCount: number;
  screenTimeStatus: 'HEALTHY' | 'BREAK_RECOMMENDED' | 'LIMIT_REACHED';
}

export interface ContentRiskAssessment {
  contentId: string;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresHumanReview: boolean;
  isApproved: boolean;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ParentTeacherNote {
  noteId: string;
  learnerId: string;
  teacherId: string;
  parentId: string;
  subject: string;
  message: string;
  createdAt: string;
  readByParent: boolean;
  readByTeacher: boolean;
  tags: string[];
}

export type DeviceMode = 'CHILD' | 'PARENT' | 'TEACHER';

export interface SharedDeviceSession {
  deviceId: string;
  activeLearnerId?: string;
  currentMode: DeviceMode;
  pinVerified: boolean;
  sessionStartedAt: string;
  sessionExpiresAt: string;
}

export interface DualPilotMetrics {
  pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY';
  targetLearnersCount: number;
  enrolledLearnersCount: number;
  consentVerificationRate: number; // 0.0 - 1.0
  safetyIncidentsCount: number;
  unresolvedSafetyIncidentsCount: number;
  averageSessionMinutes: number;
  acousticFailureRecoveryRate: number; // 0.0 - 1.0
  parentTeacherCheckInRate: number; // 0.0 - 1.0
  masteryGainAverage: number; // 0.0 - 1.0
  pilotStatus: 'PLANNING' | 'ACTIVE' | 'EVALUATION' | 'COMPLETED';
}

