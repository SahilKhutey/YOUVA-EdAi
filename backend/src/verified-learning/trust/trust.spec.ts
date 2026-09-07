import { contentTrustScore, evidenceTrustScore } from './trust.service';

describe('Trust Scoring & Decomposition', () => {
  describe('evidenceTrustScore', () => {
    it('returns one for perfect trust signals', () => {
      expect(
        evidenceTrustScore({
          provenance: 1,
          integrity: 1,
          completeness: 1,
          consistency: 1,
        }),
      ).toBe(1);
    });

    it('decreases with weak integrity', () => {
      const strong = evidenceTrustScore({
        provenance: 1,
        integrity: 1,
        completeness: 1,
        consistency: 1,
      });

      const weak = evidenceTrustScore({
        provenance: 1,
        integrity: 0,
        completeness: 1,
        consistency: 1,
      });

      expect(strong).toBeGreaterThan(weak);
    });
  });

  describe('contentTrustScore', () => {
    it('returns one for perfect content trust signals', () => {
      expect(
        contentTrustScore({
          curriculumAlignment: 1,
          safety: 1,
          accessibility: 1,
          teacherReview: 1,
          effectiveness: 1,
          provenance: 1,
        }),
      ).toBe(1);
    });
  });
});
