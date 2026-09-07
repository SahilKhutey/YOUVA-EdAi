import {
  evaluateCredentialEligibility,
  meetsTemplateCriteria,
  deduplicateEvidence,
} from './credential-eligibility';

describe('Credential Eligibility Engine', () => {
  it('rejects insufficient mastery', () => {
    const result = evaluateCredentialEligibility({
      mastery: 0.60,
      minimumMastery: 0.80,
      evidenceCount: 5,
      minimumEvidence: 3,
      verificationLevel: 'TEACHER_VERIFIED',
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Minimum mastery not reached.');
  });

  it('rejects insufficient evidence', () => {
    const result = evaluateCredentialEligibility({
      mastery: 0.90,
      minimumMastery: 0.80,
      evidenceCount: 1,
      minimumEvidence: 3,
      verificationLevel: 'TEACHER_VERIFIED',
    });

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Insufficient learning evidence.');
  });

  it('accepts sufficient evidence and mastery', () => {
    const result = evaluateCredentialEligibility({
      mastery: 0.90,
      minimumMastery: 0.80,
      evidenceCount: 5,
      minimumEvidence: 3,
      verificationLevel: 'TEACHER_VERIFIED',
    });

    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(result.humanVerificationRequired).toBe(true);
  });

  it('evaluates template criteria correctly', () => {
    expect(
      meetsTemplateCriteria({
        mastery: 0.85,
        evidenceCount: 4,
        minimumMastery: 0.80,
        minimumEvidence: 3,
      }),
    ).toBe(true);

    expect(
      meetsTemplateCriteria({
        mastery: 0.75,
        evidenceCount: 4,
        minimumMastery: 0.80,
        minimumEvidence: 3,
      }),
    ).toBe(false);
  });

  it('deduplicates evidence submissions', () => {
    const rawEvidence = ['ev-1', 'ev-2', 'ev-1', 'ev-3', 'ev-2'];
    const deduped = deduplicateEvidence(rawEvidence);
    expect(deduped).toEqual(['ev-1', 'ev-2', 'ev-3']);
  });
});
