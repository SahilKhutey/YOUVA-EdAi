import { DriftDetectionService } from '../drift/drift-detection.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DriftDetectionService (LKC-16)', () => {
  let service: DriftDetectionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      learningDriftSignal: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'drift-sig-1', ...data, createdAt: new Date() }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new DriftDetectionService(mockPrisma as unknown as PrismaService);
  });

  it('should detect statistical drift when distribution diverges beyond threshold', async () => {
    const baseline = { EASY: 0.5, MEDIUM: 0.3, HARD: 0.2 };
    const current = { EASY: 0.1, MEDIUM: 0.2, HARD: 0.7 }; // Significant shift to HARD

    const signal = await service.detectDrift({
      targetType: 'QUESTION_DIFFICULTY',
      targetId: 'ITEM_MATH_01',
      baselineDistribution: baseline,
      currentDistribution: current,
      driftType: 'OUTPUT',
    });

    expect(signal).not.toBeNull();
    expect(signal?.id).toBe('drift-sig-1');
    expect(signal?.driftType).toBe('OUTPUT');
    expect(signal?.severity).toBe('HIGH');
    expect(mockPrisma.learningDriftSignal.create).toHaveBeenCalled();
  });

  it('should not emit signal when distribution remains within tolerance', async () => {
    const baseline = { EASY: 0.5, MEDIUM: 0.3, HARD: 0.2 };
    const current = { EASY: 0.48, MEDIUM: 0.31, HARD: 0.21 }; // Minor variation

    const signal = await service.detectDrift({
      targetType: 'QUESTION_DIFFICULTY',
      targetId: 'ITEM_MATH_01',
      baselineDistribution: baseline,
      currentDistribution: current,
      driftType: 'OUTPUT',
    });

    expect(signal).toBeNull();
    expect(mockPrisma.learningDriftSignal.create).not.toHaveBeenCalled();
  });
});
