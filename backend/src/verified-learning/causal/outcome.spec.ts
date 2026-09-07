import { averageTreatmentEffect } from './causal-study.service';

describe('Causal Evaluation & Average Treatment Effect', () => {
  describe('averageTreatmentEffect', () => {
    it('calculates treatment minus control', () => {
      expect(averageTreatmentEffect(0.80, 0.65)).toBeCloseTo(0.15);
    });

    it('supports negative effects', () => {
      expect(averageTreatmentEffect(0.60, 0.70)).toBeCloseTo(-0.10);
    });
  });
});
