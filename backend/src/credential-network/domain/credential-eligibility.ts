import { CredentialEligibility } from '../types/credential.types';

export interface EvaluateEligibilityInput {
  mastery: number;
  minimumMastery: number;
  evidenceCount: number;
  minimumEvidence: number;
  verificationLevel: string;
}

/**
 * Deterministic eligibility evaluator.
 * Invariant: Credential != mastery. Mastery is a signal; credential requires minimum mastery,
 * sufficient evidence, and human authority gating.
 */
export function evaluateCredentialEligibility(
  input: EvaluateEligibilityInput,
): CredentialEligibility {
  const reasons: string[] = [];

  if (input.mastery < input.minimumMastery) {
    reasons.push('Minimum mastery not reached.');
  }

  if (input.evidenceCount < input.minimumEvidence) {
    reasons.push('Insufficient learning evidence.');
  }

  const humanVerificationRequired =
    input.verificationLevel !== 'INSTITUTION_VERIFIED';

  return {
    eligible: reasons.length === 0,
    reasons,
    evidenceCount: input.evidenceCount,
    minimumMastery: input.minimumMastery,
    currentMastery: input.mastery,
    humanVerificationRequired,
  };
}

export interface CredentialTemplateInput {
  mastery: number;
  evidenceCount: number;
  minimumMastery?: number;
  minimumEvidence?: number;
}

/**
 * Evaluates whether student achievement meets the requirements of an institutional template.
 */
export function meetsTemplateCriteria(
  input: CredentialTemplateInput,
): boolean {
  if (
    input.minimumMastery !== undefined &&
    input.mastery < input.minimumMastery
  ) {
    return false;
  }

  if (
    input.minimumEvidence !== undefined &&
    input.evidenceCount < input.minimumEvidence
  ) {
    return false;
  }

  return true;
}

/**
 * Anti-gaming control: deduplicates evidence IDs to prevent inflated counts.
 */
export function deduplicateEvidence(evidenceIds: string[]): string[] {
  return [...new Set(evidenceIds)];
}
