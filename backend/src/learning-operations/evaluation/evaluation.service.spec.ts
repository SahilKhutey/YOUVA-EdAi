import { calculateOutcome, recommendationQuality } from './evaluation.types';
import { InterventionEvaluationService } from './intervention-evaluation.service';

describe('calculateOutcome, recommendationQuality & EvaluationService', () => {
  let service: InterventionEvaluationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      interventionEvaluation: { create: jest.fn() },
      learningIntervention: { update: jest.fn() },
    };
    service = new InterventionEvaluationService(prisma);
  });

  it('calculates outcome states properly', () => {
    expect(calculateOutcome(0.5, 0.65)).toBe('SUCCESS'); // improvement 0.15 >= 0.10
    expect(calculateOutcome(0.5, 0.55)).toBe('PARTIAL'); // improvement 0.05 > 0
    expect(calculateOutcome(0.5, 0.45)).toBe('FAILED');  // improvement -0.05 <= 0
  });

  it('scores recommendation quality accurately', () => {
    const quality = recommendationQuality({
      accepted: true,           // 0.20
      completed: true,          // 0.20
      teacherModified: false,   // 0.15
      learningImprovement: 0.8, // 0.8 * 0.45 = 0.36
      safetyIssue: false,
    });
    // 0.20 + 0.20 + 0.15 + 0.36 = 0.91
    expect(quality).toBeCloseTo(0.91, 2);
  });

  it('drops recommendation quality to 0 if a safety issue is present', () => {
    const quality = recommendationQuality({
      accepted: true,
      completed: true,
      teacherModified: false,
      learningImprovement: 1.0,
      safetyIssue: true, // Safety gate violation
    });
    expect(quality).toBe(0);
  });

  it('evaluates and records intervention outcomes', async () => {
    const outcome = await service.evaluateOutcome({
      interventionId: 'int-123',
      baselineMastery: 0.4,
      postMastery: 0.7,
      evidenceCount: 5,
    });

    expect(outcome.status).toBe('SUCCESS');
    expect(prisma.interventionEvaluation.create).toHaveBeenCalled();
  });
});
