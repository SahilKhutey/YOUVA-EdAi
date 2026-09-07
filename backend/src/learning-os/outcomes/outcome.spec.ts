import { calculateOutcome, canPublishBenchmark } from './outcome.service';

describe('Outcome Intelligence & Benchmarking', () => {
  describe('calculateOutcome', () => {
    it('returns mastery gain when optional signals are absent', () => {
      expect(
        calculateOutcome({
          baselineMastery: 0.4,
          finalMastery: 0.8,
        }),
      ).toBeCloseTo(0.2);
    });

    it('includes retention and transfer', () => {
      const result = calculateOutcome({
        baselineMastery: 0.4,
        finalMastery: 0.8,
        retentionScore: 1,
        transferScore: 1,
        independence: 1,
      });

      expect(result).toBeGreaterThan(0.2);
    });
  });

  describe('canPublishBenchmark', () => {
    it('rejects tiny populations', () => {
      expect(canPublishBenchmark(5, 20)).toBe(false);
    });

    it('allows sufficiently large populations', () => {
      expect(canPublishBenchmark(100, 20)).toBe(true);
    });
  });
});
