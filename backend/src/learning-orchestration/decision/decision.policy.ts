import { AdaptivePolicy, MasteryPolicy } from './decision.types';

export const CURRENT_POLICY_VERSION = 'adaptive-policy-v1';

export const DEFAULT_MASTERY_POLICY: MasteryPolicy = {
  minimumMasteryForAdvance: 0.8,
  minimumConfidenceForAdvance: 0.7,
  struggleThreshold: 0.5,
  reviewIntervalDays: 7,
  minimumEvidenceCount: 3,
};

export const DEFAULT_ADAPTIVE_POLICY: AdaptivePolicy = {
  masteryThreshold: 0.8,
  confidenceThreshold: 0.7,
  struggleThreshold: 0.5,
  minimumEvidence: 3,
  reviewIntervalDays: 7,
  maxRemediationDepth: 3,
  maxInterventionsPerSession: 5,
  allowAiCandidates: true,
};
