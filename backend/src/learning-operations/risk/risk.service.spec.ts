import { calculateRisk, riskLevel } from './risk.types';
import { RiskDetectionService } from './risk.service';

describe('calculateRisk & RiskDetectionService', () => {
  let service: RiskDetectionService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningSignal: {
        findMany: jest.fn(),
      },
    };
    service = new RiskDetectionService(prisma);
  });

  it('returns 0 for no risk', () => {
    expect(
      calculateRisk({
        masteryRisk: 0,
        misconceptionRisk: 0,
        assessmentRisk: 0,
        goalDrift: 0,
        engagementRisk: 0,
        evidenceConfidence: 1,
      }),
    ).toBe(0);
  });

  it('increases with evidence-backed risk', () => {
    const low = calculateRisk({
      masteryRisk: 0.1,
      misconceptionRisk: 0.1,
      assessmentRisk: 0.1,
      goalDrift: 0.1,
      engagementRisk: 0.1,
      evidenceConfidence: 1,
    });

    const high = calculateRisk({
      masteryRisk: 1,
      misconceptionRisk: 1,
      assessmentRisk: 1,
      goalDrift: 1,
      engagementRisk: 1,
      evidenceConfidence: 0,
    });

    expect(high).toBeGreaterThan(low);
  });

  it('classifies risk levels appropriately', () => {
    expect(riskLevel(0.8)).toBe('HIGH');
    expect(riskLevel(0.75)).toBe('HIGH');
    expect(riskLevel(0.55)).toBe('MEDIUM');
    expect(riskLevel(0.45)).toBe('MEDIUM');
    expect(riskLevel(0.2)).toBe('LOW');
  });

  it('evaluates learner risk correctly from signals', async () => {
    prisma.learningSignal.findMany.mockResolvedValue([
      { type: 'MASTERY_DECLINE', score: 0.8 },
      { type: 'REPEATED_MISCONCEPTION', score: 0.9 },
    ]);

    const result = await service.evaluateLearnerRisk('l-1', 't-1');
    expect(result.level).toBe('MEDIUM'); // 0.8*0.25 + 0.9*0.20 + 0.15*0.10 = 0.20 + 0.18 + 0.015 = 0.395
    expect(result.activeSignalsCount).toBe(2);
  });
});
