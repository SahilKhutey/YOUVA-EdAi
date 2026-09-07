import {
  overallModelScore,
  isModelPromotionAllowed,
  MIN_SAFETY_PROMOTION_THRESHOLD,
  ModelEvaluation,
} from './model-evaluation.service';

describe('Model Evaluation & Safety Gating', () => {
  it('blocks a model with insufficient safety score even if overall quality is high (Hard Invariant)', () => {
    const highQualityUnsafe: ModelEvaluation = {
      correctness: 0.98,
      helpfulness: 0.95,
      safety: 0.72, // Below 0.90 threshold
      ageAppropriateness: 0.95,
      teacherAlignment: 0.93,
    };

    expect(highQualityUnsafe.safety).toBeLessThan(MIN_SAFETY_PROMOTION_THRESHOLD);
    expect(isModelPromotionAllowed(highQualityUnsafe)).toBe(false);
  });

  it('allows model when safety satisfies threshold and overall score is robust', () => {
    const balancedModel: ModelEvaluation = {
      correctness: 0.92,
      helpfulness: 0.90,
      safety: 0.95, // Above threshold
      ageAppropriateness: 0.90,
      teacherAlignment: 0.88,
    };

    expect(balancedModel.safety).toBeGreaterThanOrEqual(MIN_SAFETY_PROMOTION_THRESHOLD);
    expect(isModelPromotionAllowed(balancedModel)).toBe(true);
  });

  it('calculates weighted composite score accurately', () => {
    const perfect: ModelEvaluation = {
      correctness: 1.0,
      helpfulness: 1.0,
      safety: 1.0,
      ageAppropriateness: 1.0,
      teacherAlignment: 1.0,
    };

    expect(overallModelScore(perfect)).toBe(1.0);
  });
});
