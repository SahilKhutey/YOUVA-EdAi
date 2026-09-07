import { ModelDriftService } from './model-drift.service';

describe('ModelDriftService', () => {
  let service: ModelDriftService;

  beforeEach(() => {
    service = new ModelDriftService();
  });

  describe('calculateRelativeDrift', () => {
    it('calculates relative drift correctly', () => {
      // 0.90 to 0.81 is a 10% drift
      const drift = service.calculateRelativeDrift(0.90, 0.81);
      expect(drift).toBe(0.1);
    });

    it('handles zero baseline gracefully', () => {
      const drift = service.calculateRelativeDrift(0, 0.05);
      expect(drift).toBe(0.05);
    });
  });

  describe('evaluateDrift & Safety Invariants', () => {
    const baseline = {
      correctness: 0.95,
      safety: 0.99,
      helpfulness: 0.92,
      ageAppropriateness: 0.96,
    };

    it('approves NORMAL_OPERATION when model metrics are stable', () => {
      const current = {
        correctness: 0.94, // ~1% drift
        safety: 0.99,      // 0% drift
        helpfulness: 0.91, // ~1% drift
        ageAppropriateness: 0.95,
      };

      const report = service.evaluateDrift(baseline, current);

      expect(report.healthy).toBe(true);
      expect(report.criticalViolation).toBe(false);
      expect(report.recommendation).toBe('NORMAL_OPERATION');
    });

    it('triggers FLAG_FOR_MONITORING when drift is between 8% and 15%', () => {
      const current = {
        correctness: 0.85, // 10.5% drift
        safety: 0.99,
        helpfulness: 0.90,
      };

      const report = service.evaluateDrift(baseline, current);

      expect(report.healthy).toBe(true);
      expect(report.criticalViolation).toBe(false);
      expect(report.recommendation).toBe('FLAG_FOR_MONITORING');
    });

    it('triggers immediate ROLLBACK when safety drops by more than 5%', () => {
      const current = {
        correctness: 0.95,
        safety: 0.92, // 7.07% drop in safety (exceeds 5% threshold)
        helpfulness: 0.92,
      };

      const report = service.evaluateDrift(baseline, current);

      expect(report.healthy).toBe(false);
      expect(report.criticalViolation).toBe(true);
      expect(report.recommendation).toBe('TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION');
    });

    it('triggers ROLLBACK when general performance drops by more than 15%', () => {
      const current = {
        correctness: 0.78, // ~17.8% drop
        safety: 0.99,
        helpfulness: 0.92,
      };

      const report = service.evaluateDrift(baseline, current);

      expect(report.healthy).toBe(false);
      expect(report.criticalViolation).toBe(false);
      expect(report.recommendation).toBe('TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION');
    });
  });
});
