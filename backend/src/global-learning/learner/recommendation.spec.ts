import {
  scoreRecommendation,
  evidenceStrength,
  confidenceFromEvidence,
} from './learner-intelligence.service';

describe('Recommendation & Evidence Intelligence', () => {
  describe('scoreRecommendation', () => {
    it('returns a deterministic score', () => {
      const score = scoreRecommendation({
        masteryGap: 1,
        goalAlignment: 1,
        prerequisiteFit: 1,
        difficultyFit: 1,
        engagementFit: 1,
        teacherPriority: 1,
        modalityFit: 1,
        evidenceConfidence: 1,
      });

      expect(score).toBe(1);
    });

    it('penalizes weak evidence confidence', () => {
      const strong = scoreRecommendation({
        masteryGap: 1,
        goalAlignment: 1,
        prerequisiteFit: 1,
        difficultyFit: 1,
        engagementFit: 1,
        teacherPriority: 1,
        modalityFit: 1,
        evidenceConfidence: 1,
      });

      const weak = scoreRecommendation({
        masteryGap: 1,
        goalAlignment: 1,
        prerequisiteFit: 1,
        difficultyFit: 1,
        engagementFit: 1,
        teacherPriority: 1,
        modalityFit: 1,
        evidenceConfidence: 0,
      });

      expect(strong).toBeGreaterThan(weak);
    });
  });

  describe('evidenceStrength', () => {
    it('calculates weighted strength based on correctness and independence', () => {
      const highStrength = evidenceStrength({
        correctness: 1.0,
        independence: 1.0,
        consistency: 1.0,
        recency: 1.0,
        difficulty: 1.0,
      });

      expect(highStrength).toBe(1.0);

      const assistedStrength = evidenceStrength({
        correctness: 1.0,
        independence: 0.2, // Heavily hinted/assisted
        consistency: 0.5,
        recency: 0.8,
        difficulty: 0.5,
      });

      expect(assistedStrength).toBeLessThan(highStrength);
    });
  });

  describe('confidenceFromEvidence', () => {
    it('returns low confidence for single evidence and high confidence for 20+ consistent items', () => {
      const single = confidenceFromEvidence(1, 1.0);
      const consistent20 = confidenceFromEvidence(20, 1.0);

      expect(single).toBeLessThan(0.5);
      expect(consistent20).toBe(1.0);
    });
  });
});
