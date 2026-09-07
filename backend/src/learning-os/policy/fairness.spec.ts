import {
  absolutePredictionError,
  denyIfConsentMissing,
  fairnessGap,
} from './policy.service';

describe('Policy & Fairness Monitoring', () => {
  describe('fairnessGap', () => {
    it('returns zero for equal outcomes', () => {
      expect(fairnessGap(0.8, 0.8)).toBe(0);
    });

    it('returns absolute difference', () => {
      expect(fairnessGap(0.8, 0.6)).toBeCloseTo(0.2);
    });
  });

  describe('denyIfConsentMissing', () => {
    it('denies processing when consent is false', () => {
      const decision = denyIfConsentMissing(false, '1.0.0');
      expect(decision.allowed).toBe(false);
      expect(decision.reasonCode).toBe('CONSENT_REQUIRED');
    });

    it('allows processing when consent is granted', () => {
      const decision = denyIfConsentMissing(true, '1.0.0');
      expect(decision.allowed).toBe(true);
      expect(decision.reasonCode).toBe('ALLOWED');
    });
  });

  describe('absolutePredictionError', () => {
    it('calculates absolute error between predicted and actual outcome', () => {
      expect(absolutePredictionError(0.85, 0.80)).toBeCloseTo(0.05);
      expect(absolutePredictionError(0.70, 0.90)).toBeCloseTo(0.20);
    });
  });
});
