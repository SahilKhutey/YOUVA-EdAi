import { MasteryEvaluatorService } from './mastery-evaluator.service';

describe('MasteryEvaluatorService (LKC-4)', () => {
  let evaluator: MasteryEvaluatorService;

  beforeEach(() => {
    evaluator = new MasteryEvaluatorService();
  });

  it('evaluates no evidence as NOT_STARTED with zero confidence and mastery', () => {
    const result = evaluator.evaluate({
      attempts: 0,
      correctAttempts: 0,
      streakCount: 0,
      hintsUsed: 0,
      explanationsRequested: 0,
    });

    expect(result.status).toBe('NOT_STARTED');
    expect(result.masteryLevel).toBe(0.0);
    expect(result.confidence).toBe(0.0);
    expect(result.nextReviewAt).toBeNull();
  });

  it('evaluates initial few activities as LEARNING with modest confidence', () => {
    const result = evaluator.evaluate({
      attempts: 2,
      correctAttempts: 2,
      streakCount: 2,
      hintsUsed: 0,
      explanationsRequested: 0,
    });

    expect(result.status).toBe('LEARNING');
    expect(result.confidence).toBeLessThan(0.70); // Insufficient volume
  });

  it('detects struggle when consecutive errors or low accuracy occur', () => {
    const result = evaluator.evaluate({
      attempts: 4,
      correctAttempts: 1,
      streakCount: 0,
      hintsUsed: 2,
      explanationsRequested: 2,
    });

    expect(result.status).toBe('STRUGGLING');
    expect(result.isStruggling).toBe(true);
    expect(result.struggleScore).toBeGreaterThanOrEqual(0.50);
  });

  it('awards MASTERED when high accuracy, consistency, and volume are demonstrated', () => {
    const result = evaluator.evaluate({
      attempts: 12,
      correctAttempts: 12,
      streakCount: 5,
      hintsUsed: 0,
      explanationsRequested: 0,
      averageDifficulty: 0.7,
    });

    expect(result.status).toBe('MASTERED');
    expect(result.masteryLevel).toBeGreaterThanOrEqual(0.85);
    expect(result.confidence).toBeGreaterThanOrEqual(0.70);
    expect(result.nextReviewAt).not.toBeNull();
  });

  it('classifies solid moderate performance as DEVELOPING with review scheduled', () => {
    const result = evaluator.evaluate({
      attempts: 6,
      correctAttempts: 4,
      streakCount: 2,
      hintsUsed: 1,
      explanationsRequested: 0,
      averageDifficulty: 0.5,
    });

    expect(result.status).toBe('DEVELOPING');
    expect(result.masteryLevel).toBeGreaterThanOrEqual(0.50);
    expect(result.nextReviewAt).not.toBeNull();
  });

  it('identifies NEEDS_REVIEW when elapsed time since last activity exceeds 14 days', () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const result = evaluator.evaluate({
      attempts: 5,
      correctAttempts: 4,
      streakCount: 2,
      hintsUsed: 0,
      explanationsRequested: 0,
      lastActivityAt: fifteenDaysAgo,
    });

    expect(result.status).toBe('NEEDS_REVIEW');
  });

  it('guarantees mastery level is strictly clamped between 0.0 and 1.0', () => {
    const superHigh = evaluator.evaluate({
      attempts: 50,
      correctAttempts: 50,
      streakCount: 20,
      hintsUsed: 0,
      explanationsRequested: 0,
      averageDifficulty: 1.0,
    });
    expect(superHigh.masteryLevel).toBeLessThanOrEqual(1.0);

    const superLow = evaluator.evaluate({
      attempts: 10,
      correctAttempts: 0,
      streakCount: 0,
      hintsUsed: 10,
      explanationsRequested: 10,
      averageDifficulty: 0.1,
    });
    expect(superLow.masteryLevel).toBeGreaterThanOrEqual(0.0);
  });
});
