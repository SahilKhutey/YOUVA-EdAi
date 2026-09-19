/**
 * YOUVA-EdAI — Milestone N20 Types
 * Lifelong Learning OS, Human Capability Graph & Global Learning Intelligence
 * Governed by YOUVA-N20-CHARTER-2026
 */

export type CapabilityLevel = 
  | 'FOUNDATION'
  | 'DEVELOPING'
  | 'INDEPENDENT'
  | 'ADVANCED'
  | 'EXPERT';

export type CapabilityState =
  | 'UNVERIFIED'
  | 'EMERGING'
  | 'VALIDATED'
  | 'PROFICIENT'
  | 'MASTERY'
  | 'NEEDS_EVIDENCE'
  | 'STALE';

export interface CapabilityDimensions {
  applicationScore: number;     // 0-100: Ability in authentic, unstructured contexts
  independenceScore: number;    // 0-100: Autonomy without AI scaffolding
  transferScore: number;        // 0-100: Cross-domain applicability
  recencyTimestamp: number;     // Epoch ms of last demonstrated evidence
  evidenceStrengthScore: number;// 0-100: Cryptographic provenance & multi-evaluator score
}

export interface CapabilityEvidenceContext {
  scenarioType: 'PRODUCTION_PROJECT' | 'LAB_EXPERIMENT' | 'PEER_REVIEWED_CODE' | 'ORAL_DEFENSE' | 'WORKPLACE_TASK';
  scaffoldingLevel: 'NONE' | 'MINIMAL_PROMPT' | 'STRUCTURED_GUIDANCE' | 'HEAVY_ASSIST';
  verificationTier: 'CRYPTOGRAPHIC_PROOF' | 'INSTITUTIONAL_ENDORSEMENT' | 'MULTI_ASSESSOR_CONSENSUS';
  evidenceArtifactUris: string[];
}

export interface Capability {
  id: string;
  slug: string;
  title: string;
  domain: string;
  description: string;
  level: CapabilityLevel;
  state: CapabilityState;
  dimensions: CapabilityDimensions;
  prerequisites: string[]; // IDs of required capabilities
  relatedSkills: string[];  // IDs from N19 Skills Graph
  evidenceIds: string[];    // IDs from N19 Evidence Graph
  contextHistory: CapabilityEvidenceContext[];
  createdAt: string;
  updatedAt: string;
}

export type LearnerGoalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';

export type PathwayType =
  | 'PROJECT_BASED'
  | 'PRACTICE_DRIVEN'
  | 'MENTOR_ASSISTED'
  | 'ACCELERATED_SYNTHESIS';

export interface PathwayStep {
  stepIndex: number;
  title: string;
  description: string;
  targetCapabilityId: string;
  actionType: 'BUILD' | 'SOLVE' | 'COLLABORATE' | 'REFLECT';
  estimatedHours: number;
  completed: boolean;
}

export interface LearningPathway {
  id: string;
  type: PathwayType;
  title: string;
  description: string;
  steps: PathwayStep[];
  estimatedTotalHours: number;
  isAiScaffolded: boolean;
}

export interface LearnerGoal {
  id: string;
  learnerId: string;
  targetCapabilityId: string;
  title: string;
  rationale: string;
  status: LearnerGoalStatus;
  targetDate: string;
  activePathwayId?: string;
  pathways: LearningPathway[];
  currentProgressPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityGapDiagnosis {
  learnerId: string;
  targetCapabilityId: string;
  currentLevel: CapabilityLevel | 'NONE';
  missingPrerequisites: string[];
  weakDimensions: (keyof CapabilityDimensions)[];
  recommendedPathways: LearningPathway[];
  estimatedEffortHours: number;
  diagnosedAt: string;
}

export type OpportunityType =
  | 'INTERNSHIP'
  | 'APPRENTICESHIP'
  | 'RESEARCH'
  | 'FELLOWSHIP'
  | 'FULL_TIME'
  | 'PROJECT_GIG';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  opportunityType: OpportunityType;
  requiredCapabilities: string[]; // Capability IDs
  preferredCapabilities: string[];
  location: string;
  isRemote: boolean;
  compensationRange: string;
  sanitized: boolean;
  injectionRiskScore: number; // 0-100 (0 = clean, >30 = flagged)
  createdAt: string;
}

export interface OpportunityCompatibility {
  opportunityId: string;
  learnerId: string;
  matchScore: number; // 0-100
  demonstratedCapabilities: string[];
  gapCapabilities: string[];
  recommendationSummary: string;
  nonSelectionDisclaimer: string; // Mandatory non-consequentiality statement
  evaluatedAt: string;
}

export interface Experience {
  id: string;
  learnerId: string;
  title: string;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  validatedCapabilities: string[];
  evidenceIds: string[];
  narrative: string;
}

export type OutcomeCategory =
  | 'EMPLOYMENT'
  | 'WAGE_GROWTH'
  | 'RESEARCH_PUBLICATION'
  | 'VENTURE_FOUNDED'
  | 'CAREER_PIVOT';

export interface LongitudinalOutcome {
  id: string;
  learnerId: string;
  category: OutcomeCategory;
  title: string;
  metricValue: string;
  recordedAt: string;
  associatedCapabilityIds: string[];
  correlationStrength: number; // 0.0 - 1.0 (statistical correlation, NOT causality)
  causalityDisclaimer: string; // Mandatory Invariant 6 legal text
}

export interface AiCoachInteraction {
  id: string;
  learnerId: string;
  capabilityId: string;
  prompt: string;
  guidanceText: string;
  metacognitiveReflectionPrompt: string;
  scaffoldingLevel: 'NONE' | 'SCAFFOLDED' | 'INDEPENDENT_CHALLENGE';
  aiRemovalTestApplied: boolean;
  performanceDropPct?: number;
  aiDependencyFlagged: boolean;
  teacherOverrideReason?: string;
  createdAt: string;
}

export interface CapabilityInflationSignal {
  id: string;
  signalType: 'UNREALISTIC_VELOCITY' | 'COLLUSION_CLUSTER' | 'SYNTHETIC_EVIDENCE' | 'ASSESSOR_DRIFT';
  riskScore: number; // 0-100
  affectedCapabilityId: string;
  affectedLearnerId?: string;
  detectedAt: string;
  mitigationAction: string;
}
