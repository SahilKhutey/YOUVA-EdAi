import { calculateOpportunity } from './opportunity.types';
import { OpportunityDetectionService } from './opportunity.service';

describe('calculateOpportunity & OpportunityDetectionService', () => {
  let service: OpportunityDetectionService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningSignal: {
        findMany: jest.fn(),
      },
    };
    service = new OpportunityDetectionService(prisma);
  });

  it('returns maximum for maximum signals', () => {
    expect(
      calculateOpportunity({
        mastery: 1,
        confidence: 1,
        consistency: 1,
        goalAlignment: 1,
        prerequisiteCompletion: 1,
      }),
    ).toBe(1);
  });

  it('calculates weighted opportunity score accurately', () => {
    const score = calculateOpportunity({
      mastery: 0.8,
      confidence: 0.9,
      consistency: 0.7,
      goalAlignment: 1.0,
      prerequisiteCompletion: 1.0,
    });
    // 0.8*0.3 + 0.9*0.2 + 0.7*0.2 + 1.0*0.15 + 1.0*0.15 = 0.24 + 0.18 + 0.14 + 0.15 + 0.15 = 0.86
    expect(score).toBeCloseTo(0.86, 2);
  });

  it('detects advancement opportunity when score >= 0.8', async () => {
    prisma.learningSignal.findMany.mockResolvedValue([
      { type: 'MASTERY_BREAKTHROUGH', score: 0.95 },
    ]);

    const result = await service.detectOpportunities('learner-1', 'tenant-1');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.opportunities[0].type).toBe('ADVANCEMENT');
  });
});
