import { canVerifyClaim, evidenceQualityScore } from './claim.service';

describe('Claim Verification & Quality Evaluation', () => {
  describe('canVerifyClaim', () => {
    const valid = {
      claimId: 'claim-101',
      sampleSize: 100,
      evidenceQuality: 0.9,
      replicationCount: 2,
      independentSources: 1,
      safetyPassed: true,
      privacyPassed: true,
      reviewerApproved: true,
    };

    it('accepts a fully validated claim', () => {
      expect(canVerifyClaim(valid)).toBe(true);
    });

    it('rejects insufficient evidence (sampleSize < 30)', () => {
      expect(
        canVerifyClaim({
          ...valid,
          sampleSize: 10,
        }),
      ).toBe(false);
    });

    it('rejects missing replication (replicationCount < 2)', () => {
      expect(
        canVerifyClaim({
          ...valid,
          replicationCount: 1,
        }),
      ).toBe(false);
    });

    it('rejects safety failure', () => {
      expect(
        canVerifyClaim({
          ...valid,
          safetyPassed: false,
        }),
      ).toBe(false);
    });
  });

  describe('evidenceQualityScore', () => {
    it('calculates weighted score accurately', () => {
      const score = evidenceQualityScore({
        independence: 1.0,
        consistency: 1.0,
        completeness: 1.0,
        provenance: 1.0,
        outcomeStrength: 1.0,
      });

      expect(score).toBeCloseTo(1.0);
    });
  });
});
