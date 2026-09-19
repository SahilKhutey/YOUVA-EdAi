/**
 * YOUVA-EdAI — Milestone N18 Domain Types & Invariants
 * Advanced Learning Science, Cognitive Personalization & Human Development Intelligence
 * Clauses N18.0 – N18.189
 */

export type EvidenceLevel =
  | 'LEVEL_1_INTERACTION'        // Casual clicks, reading events, response latency (weight: 0.10)
  | 'LEVEL_2_PRACTICE'           // Guided formative practice exercises (weight: 0.25)
  | 'LEVEL_3_ASSESSMENT'         // Summative unassisted evaluations (weight: 0.50)
  | 'LEVEL_4_TRANSFER'           // Novel, unpracticed problem schemas (weight: 0.75)
  | 'LEVEL_5_RETENTION'          // Delayed spaced retrieval evaluations (30d+) (weight: 0.85)
  | 'LEVEL_6_TEACHER_VALIDATED'; // Authoritative educator classroom observation (weight: 1.00)

export interface LearningEvidenceEvent {
  eventId: string;
  learnerId: string;
  conceptId: string;
  level: EvidenceLevel;
  score: number;                 // 0 - 100
  difficultyWeight: number;      // 0.1 - 2.0
  recencyTimestamp: string;
  source: 'SYSTEM' | 'TEACHER' | 'LEARNER';
  provenanceHash: string;
}

export interface LearningState2 {
  learnerId: string;
  conceptId: string;
  mastery: number;                           // Estimated ability mean (mu: 0.00 to 1.00)
  uncertaintySigma: number;                  // Credibility dispersion (sigma: 0.01 to 0.30)
  masteryConfidenceInterval: [number, number];// [mu - sigma, mu + sigma]
  confidence: number;                        // Self-reported or inferred confidence (0 - 100)
  retentionEstimate: number;                 // Spaced retention prediction (0 - 100)
  transferEvidence: number;                  // Far transfer mastery index (0 - 100)
  recentPerformance: number;                 // Rolling unweighted accuracy (0 - 100)
  errorPatterns: string[];                   // Observed candidate misconception IDs
  hintUsage: number;                         // Total hints consumed in current cycle
  helpSeeking: number;                       // Direct help request frequency index (0.0 to 1.0)
  pacingSignal: number;                      // Pacing velocity ratio (0.5 to 2.0, 1.0 = normal)
  strategyEvidence: string[];                // Actively utilized cognitive strategies
  interventionResponses: {
    interventionId: string;
    outcomeScore: number;
    timestamp: string;
  }[];
  isRemediationTrapped: boolean;             // Flagged if >4 sessions in remediation without progress
  isChallengeTrapped: boolean;               // Flagged if escalated before confidence interval narrows
  consecutiveRemedialSessions: number;
  lastValidatedAt: string;
  modelVersion: string;
  policyVersion: string;
}

export type ErrorCategory =
  | 'CONCEPTUAL'                   // Flawed mental model or false domain axiom
  | 'PROCEDURAL'                   // Correct concept, but faulty algorithm execution steps
  | 'CALCULATION'                  // Arithmetic or algebraic sign mistake
  | 'READING'                      // Misinterpreting problem statement syntax or constraints
  | 'INSTRUCTION_MISUNDERSTANDING' // Misreading prompt directives or formatting rules
  | 'CARELESS'                     // Unconscious error despite verified prerequisite mastery
  | 'STRATEGY'                     // Inefficient or unviable problem-solving heuristic
  | 'TRANSFER_FAILURE';            // Inability to generalize principles to unfamiliar schemas

export interface MisconceptionPattern {
  misconceptionId: string;
  conceptId: string;
  description: string;
  errorCategory: ErrorCategory;
  evidenceRules: string[];
  validationActivities: string[];
  confidence: number;              // 0.00 to 1.00
  status: 'CANDIDATE' | 'VALIDATED' | 'RETIRED';
  observedCount: number;
  diagnosticConfirmations: number;
  lastObservedAt: string;
}

export type InterventionType =
  | 'RETRIEVAL_PRACTICE'
  | 'WORKED_EXAMPLE'
  | 'SCAFFOLD'
  | 'HINT'
  | 'COUNTEREXAMPLE'
  | 'VISUAL_EXPLANATION'
  | 'VERBAL_EXPLANATION'
  | 'GUIDED_PRACTICE'
  | 'INDEPENDENT_PRACTICE'
  | 'TRANSFER_TASK'
  | 'METACOGNITIVE_REFLECTION';

export interface InterventionRecord {
  interventionId: string;
  conceptId: string;
  type: InterventionType;
  title: string;
  targetMisconceptionId?: string;
  estimatedLearningGain: number;   // 0.0 to 1.0
  learnerAgencyRating: number;     // 0.0 to 1.0
  teacherFitRating: number;        // 0.0 to 1.0
  accessibilityScore: number;      // 0.0 to 1.0
  costIndex: number;               // 0.0 to 1.0
  compositeRankScore: number;      // Weighted multi-factor score
  activeStatus: boolean;
}

export type HintProgressionLevel =
  | 'CONCEPTUAL'           // Broad principle reminder
  | 'STRATEGIC'            // Methodological heuristic
  | 'PARTIAL_SCAFFOLD'     // First step structured
  | 'WORKED_EXAMPLE'       // Analogous solved problem
  | 'ANSWER_EXPLANATION';  // Full solution with underlying rationale

export interface MetacognitiveLoopState {
  sessionId: string;
  learnerId: string;
  conceptId: string;
  predictedScore: number;          // Self-reported pre-task prediction (0 - 100)
  actualScore?: number;            // Observed post-task score (0 - 100)
  calibrationDelta?: number;       // Predicted - Actual (-100 to +100)
  calibrationBias?: 'ACCURATE' | 'OVERCONFIDENT' | 'UNDERCONFIDENT';
  errorExplanation?: string;       // Learner's own explanation of why mistake occurred
  selectedStrategy?: string;       // Strategy chosen by learner for retry
  retryScore?: number;             // Score on unassisted retry
  stage:
    | 'PREDICT'
    | 'PERFORM'
    | 'COMPARE'
    | 'EXPLAIN'
    | 'CHOOSE_STRATEGY'
    | 'RETRY'
    | 'COMPLETED';
  updatedAt: string;
}

export interface AiRemovalTestResult {
  testId: string;
  learnerId: string;
  conceptId: string;
  performanceWithAi: number;       // e.g. 88%
  performanceWithoutAi: number;    // e.g. 52%
  deltaDrop: number;               // 36%
  dependencyRiskDetected: boolean; // true if deltaDrop > 35%
  scaffoldingRemedyTriggered: boolean;
  timestamp: string;
}

export type CognitiveStrategy =
  | 'RETRIEVE'
  | 'ELABORATE'
  | 'COMPARE'
  | 'PREDICT'
  | 'EXPLAIN'
  | 'REFLECT'
  | 'TRANSFER';

export interface TaskStrategyEffectiveness {
  strategy: CognitiveStrategy;
  conceptDomain: string;
  sampleCount: number;
  averageMasteryGain: number;
  retentionGain: number;
  isMythicalFixedStyle: false;     // Invariant: Rejects fixed cognitive style labels
}

export interface TeacherLearningEvidence {
  evidenceId: string;
  learnerId: string;
  conceptId: string;
  observation: string;
  evidenceType: 'CLASSROOM_PERFORMANCE' | 'VERBAL_EXPLANATION' | 'PROJECT_DEMO' | 'DIAGNOSTIC_ASSESSMENT';
  confidence: number;              // 0.00 to 1.00
  teacherId: string;
  tenantId: string;
  audited: boolean;
  createdAt: string;
}

export interface EvidenceConflictRecord {
  conflictId: string;
  learnerId: string;
  conceptId: string;
  systemEstimate: number;          // 0 - 100
  teacherEstimate: number;         // 0 - 100
  learnerSelfRating: number;       // 0 - 100
  divergenceDelta: number;         // |system - teacher|
  resolutionStatus: 'PENDING_DIAGNOSTIC' | 'RESOLVED_RECONCILED' | 'TEACHER_OVERRIDE_AFFIRMED';
  diagnosticTaskId?: string;
  resolutionRationale?: string;
  resolvedAt?: string;
}

export interface LearningExperiment {
  experimentId: string;
  hypothesis: string;
  populationDefinition: string;
  intervention: string;
  comparator: string;
  primaryMetric: string;           // Declared upfront (e.g. '30d_far_transfer')
  secondaryMetrics: string[];
  safetyMetrics: string[];
  stopConditions: string[];        // E.g. 'error_spike_gt_15%'
  status: 'PROPOSED' | 'SANDBOX_ACTIVE' | 'EVALUATING' | 'CONCLUDED' | 'STOPPED_SAFETY';
  createdAt: string;
}

export interface DecisionLineageRecord {
  decisionId: string;
  learnerId: string;
  conceptId: string;
  learningStateSnapshot: {
    mastery: number;
    uncertaintySigma: number;
    retention: number;
    transfer: number;
  };
  policyVersion: string;
  candidateActivities: string[];
  selectedActivityId: string;
  rationale: string;
  authorizationTicketId?: string;
  observedOutcomeScore?: number;
  timestamp: string;
}

export interface SimplicityBenchmarkResult {
  modelId: string;
  simpleBaselineScore: number;     // e.g. 4-parameter BKT or linear difficulty
  complexModelScore: number;       // e.g. DKT LSTM attention
  deltaAdvantage: number;          // complex - baseline
  exceedsThreshold: boolean;       // deltaAdvantage >= 0.05
  authorizedForProduction: boolean;
}
