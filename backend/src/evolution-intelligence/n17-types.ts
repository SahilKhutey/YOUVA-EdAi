/**
 * YOUVA-EdAI — Milestone N17 Domain Types & Invariants
 * Continuous Evolution, Global Learning Intelligence, Research & Ecosystem Network
 * Clauses N17.0 – N17.180
 */

export type ResearchTrackId =
  | 'R1'  // Adaptive Algorithms & Knowledge Tracing
  | 'R2'  // Spaced Repetition & Retention Modeling
  | 'R3'  // Retrieval-Based Practice vs. Passive Review
  | 'R4'  // Feedback Timing & Scaffolding Dynamics
  | 'R5'  // Dynamic Difficulty Calibration (ZPD)
  | 'R6'  // Multimodal Instruction & Modality Switching
  | 'R7'  // Metacognitive Calibration & Self-Assessment
  | 'R8'  // Far Transfer & Unfamiliar Problem Schemas
  | 'R9'  // AI Overreliance & Anti-Dependency Scaffolding
  | 'R10' // Teacher-AI Collaboration & Workload
  | 'R11' // Longitudinal Mastery Trajectories
  | 'R12'; // Universal Accessibility & Inclusive Learning

export type ResearchMethodology =
  | 'OBSERVATIONAL'
  | 'CORRELATIONAL'
  | 'QUASI_EXPERIMENTAL'
  | 'EXPERIMENTAL';

export type StudyStatus =
  | 'PROPOSED'
  | 'ACTIVE_SANDBOX'
  | 'DATA_COLLECTION'
  | 'ANALYZING'
  | 'PEER_REVIEW'
  | 'CONCLUDED'
  | 'REPRODUCED'
  | 'REJECTED';

export interface ResearchStudyRecord {
  studyId: string;
  trackId: ResearchTrackId;
  title: string;
  hypothesis: string;
  methodology: ResearchMethodology;
  targetPopulation: string;
  sampleSize: number;
  cohortCriteria: string[];
  comparator?: string;
  primaryOutcomeMetric: string;
  effectSize?: number;
  pVal?: number;
  status: StudyStatus;
  reproducibilityPackageHash?: string;
  limitations: string[];
  piName: string;
  createdAt: string;
  updatedAt: string;
}

export type GapSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GapStatus = 'IDENTIFIED' | 'STUDY_ASSIGNED' | 'RESOLVED';

export interface EvidenceGapRecord {
  gapId: string;
  conceptId: string;
  domain: string;
  ageTier: '3-7' | '7-12' | '13-18' | 'ALL';
  description: string;
  severity: GapSeverity;
  status: GapStatus;
  assignedStudyId?: string;
  identifiedAt: string;
  resolvedAt?: string;
}

export type ModelAlgorithmFamily =
  | 'BKT'       // Bayesian Knowledge Tracing
  | 'IRT'       // Item Response Theory
  | 'DKT'       // Deep Knowledge Tracing
  | 'BAYESIAN'  // Bayesian Network
  | 'SEQUENCE'  // Transformer / Attention Sequence Model
  | 'HYBRID';   // Ensembled Multi-Paradigm

export type ModelPromotionStage =
  | 'RESEARCH'
  | 'OFFLINE_EVAL'
  | 'SHADOW'
  | 'CONTROLLED_PILOT'
  | 'INDEPENDENT_REVIEW'
  | 'APPROVED'
  | 'LIMITED_PROD'
  | 'GA'
  | 'RETIRED';

export type ModelStatus =
  | 'EXPERIMENTAL'
  | 'SHADOW'
  | 'APPROVED'
  | 'RESTRICTED'
  | 'RETIRED';

export interface ModelEvalMetric {
  metric: string;
  score: number;
  baselineScore: number;
  sampleSize: number;
}

export interface LearningModelRecord {
  modelId: string;
  name: string;
  algorithmFamily: ModelAlgorithmFamily;
  version: string;
  purpose: string;
  population: string;
  inputs: string[];
  outputs: string[];
  limitations: string[];
  evaluationResults: ModelEvalMetric[];
  safetyReviewId?: string;
  approvedBy?: string;
  promotionStage: ModelPromotionStage;
  status: ModelStatus;
  accuracy: number;
  aucRoc: number;
  latencyMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPolicyRecord {
  policyId: string;
  name: string;
  scope: 'PLATFORM_DEFAULT' | 'JURISDICTION' | 'INSTITUTION' | 'CLASSROOM';
  targetModelId?: string;
  rules: {
    maxHintsPerQuestion: number;
    delayAnswerSeconds: number;
    requireReflectionOnIncorrect: boolean;
    confidencePromptFrequency: number;
    adaptiveDifficultyStep: number;
    allowDirectAnswerGiving: boolean;
  };
  safetyFloorEnforced: boolean;
  version: string;
  status: 'ACTIVE' | 'ARCHIVED';
  updatedAt: string;
}

export type ContentLifecycleStage =
  | 'ACTIVE'
  | 'REVIEW'
  | 'REVISE'
  | 'RETEST'
  | 'REAPPROVE'
  | 'RETIRED';

export type ContentModality =
  | 'TEXT'
  | 'VOICE'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'INTERACTIVE_SIMULATION';

export interface ContentArtifactMetric {
  artifactId: string;
  title: string;
  subject: string;
  conceptId: string;
  modality: ContentModality;
  lifecycleStage: ContentLifecycleStage;
  masteryGainDelta: number;      // Delta in student mastery (post vs pre)
  retentionRate30d: number;      // 0.00 to 1.00 recall after 30d
  transferRateFar: number;       // 0.00 to 1.00 application to novel schemas
  errorReductionRate: number;    // % reduction in recurring misconceptions
  completionRate: number;        // Completion ratio
  teacherApprovalRate: number;   // 0.00 to 1.00 teacher thumbs-up
  efficacyCompositeIndex: number;// Weighted composite efficacy score (0-100)
  flaggedForRetirement: boolean;
  smeReviewNotes?: string;
  lastEvaluatedAt: string;
}

export interface AiTutorBenchmarkRecord {
  benchmarkId: string;
  modelId: string;
  version: string;
  pedagogyScore: number;            // Socratic scaffolding vs direct giving (0-100)
  ageAppropriatenessScore: number;  // Tone & cognitive fit for target tier (0-100)
  clarityScore: number;             // Coherence & explanation precision (0-100)
  hallucinationRate: number;        // Curriculum discrepancy rate (0.000 to 1.000)
  safetyComplianceScore: number;    // Child safety & boundary adherence (0-100)
  instructionFollowingScore: number;// Policy obedience (0-100)
  personalizationScore: number;     // Misconception targeted assistance (0-100)
  studentUsefulnessScore: number;   // Learner understanding & self-reported clarity (0-100)
  teacherUsefulnessScore: number;   // Teacher alignment rating (0-100)
  compositeBenchmarkScore: number;  // Weighted composite (0-100)
  certifiedPass: boolean;
  evaluatedAt: string;
}

export type ScaffoldingMode =
  | 'NORMAL'
  | 'PROGRESSIVE_HINT'
  | 'DELAYED_ANSWER'
  | 'REFLECTION_MANDATORY'
  | 'INDEPENDENT_ATTEMPT_REQUIRED';

export type DependencyRiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export interface AntiDependencyMetric {
  learnerId: string;
  totalSessionCount: number;
  answerSeekingIndex: number;          // 0.00 - 1.00 (higher = passive answer hunting)
  independentReasoningRatio: number;   // 0.00 - 1.00 (higher = self-driven attempts)
  hintProgressionLevel: number;        // 1 (conceptual) to 4 (worked step)
  scaffoldingMode: ScaffoldingMode;
  dependencyRisk: DependencyRiskLevel;
  consecutiveDirectHelpRequests: number;
  transferWithoutAiScore: number;      // Performance on assessment without AI tutor
  lastInterventionAt: string;
}

export type CalibrationBias = 'ACCURATE' | 'OVERCONFIDENT' | 'UNDERCONFIDENT';

export interface MetacognitiveCalibrationRecord {
  learnerId: string;
  conceptId: string;
  selfReportedConfidence: number;      // 0 - 100
  actualPerformanceScore: number;      // 0 - 100
  calibrationError: number;            // Confidence - Score (-100 to +100)
  calibrationBias: CalibrationBias;
  recommendedReflectionStrategy: string;
  evaluatedAt: string;
}

export type TransferDistance = 'NEAR' | 'MEDIUM' | 'FAR';

export interface RetentionTransferRecord {
  learnerId: string;
  conceptId: string;
  immediateRecallScore: number;        // Measured immediately post-lesson (0-100)
  retentionIntervalDays: number;       // Days elapsed since instruction
  retainedScore: number;               // Measured on spaced retrieval (0-100)
  retentionDecayRate: number;          // Half-life decay factor
  nearTransferScore: number;           // Similar problem variant (0-100)
  mediumTransferScore: number;         // Modified domain / combined concept (0-100)
  farTransferScore: number;            // Novel schema / cross-disciplinary (0-100)
  overallTransferMastery: boolean;     // true if near >= 80 && medium >= 70 && far >= 60
  evaluatedAt: string;
}

export type QuadrantDecision =
  | 'BUILD'
  | 'CONTROLLED_RESEARCH'
  | 'REJECT'
  | 'EXPERIMENT';

export interface FourQuadrantEvaluation {
  initiativeId: string;
  title: string;
  category: 'FEATURE' | 'MODEL' | 'AGENT' | 'INTEGRATION';
  educationalValueScore: number;       // 0 - 100
  safetyRiskScore: number;             // 0 - 100 (lower score = lower risk)
  technicalReliabilityScore: number;   // 0 - 100
  economicViabilityScore: number;      // 0 - 100
  governanceControlScore: number;      // 0 - 100
  quadrantDecision: QuadrantDecision;
  assessedBy: string;
  rationale: string;
  createdAt: string;
}

export interface ComplexityBudgetRecord {
  recordId: string;
  timestamp: string;
  activeFeatureCount: number;
  activeAgentCount: number;
  activeModelCount: number;
  activeThirdPartyIntegrations: number;
  maintenanceCostIndex: number;
  governanceOverheadHours: number;
  complexityBudgetIndex: number;       // CBI (0 - 150)
  threshold: number;                   // Typically 100
  freezeTriggered: boolean;
  candidateRetirements: string[];
}

export type RedTeamDomain =
  | 'AI_EXFILTRATION'
  | 'EDUCATIONAL_MISCONCEPTION'
  | 'CHILD_DEPENDENCY'
  | 'AUTONOMY_ESCALATION';

export interface RedTeamSimulationResult {
  drillId: string;
  domain: RedTeamDomain;
  scenario: string;
  attemptedExploit: string;
  contained: boolean;
  latencyMs: number;
  mitigationTriggered: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export type ParticipantRole =
  | 'LEARNER'
  | 'TEACHER'
  | 'PARENT'
  | 'SCHOOL'
  | 'RESEARCHER'
  | 'CREDENTIAL_ISSUER'
  | 'CREDENTIAL_VERIFIER'
  | 'DEVELOPER'
  | 'AI_PROVIDER';

export type ParticipantTrustTier =
  | 'COMMUNITY'
  | 'VERIFIED'
  | 'INSTITUTIONAL'
  | 'RESTRICTED';

export interface EcosystemParticipant {
  participantId: string;
  name: string;
  role: ParticipantRole;
  trustTier: ParticipantTrustTier;
  sandboxIsolation: boolean;
  dataAccessScope: string[];
  complianceCertified: boolean;
  activeStatus: boolean;
  registeredAt: string;
}

export interface ExplainablePersonalizationRationale {
  learnerId: string;
  conceptId: string;
  recommendedActivityId: string;
  rationale: string;
  pastInteractionsAnalyzed: number;
  difficultyAdjustmentRationale: string;
  timestamp: string;
}

export interface TeacherCollaborationMetrics {
  teacherId: string;
  classId: string;
  weeklyAiRecommendationsReviewed: number;
  recommendationsAccepted: number;
  recommendationsOverridden: number;
  acceptanceRate: number;
  estimatedTeacherMinutesSaved: number;
  overrideReasonsDistribution: Record<string, number>;
  collaborationScore: number;          // 0 - 100
}
