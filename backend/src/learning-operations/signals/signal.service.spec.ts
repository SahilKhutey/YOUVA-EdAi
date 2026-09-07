import {
  detectMasteryDecline,
  detectRepeatedMisconception,
} from './signal.types';
import { LearningSignalService } from './signal.service';

describe('Signal Detection Logic & Service', () => {
  let service: LearningSignalService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningSignal: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new LearningSignalService(prisma);
  });

  it('detects mastery decline when drop >= 0.15', () => {
    expect(detectMasteryDecline(0.85, 0.65)).toBe(true); // drop = 0.20
    expect(detectMasteryDecline(0.85, 0.70)).toBe(true); // drop = 0.15
    expect(detectMasteryDecline(0.85, 0.75)).toBe(false); // drop = 0.10
  });

  it('detects repeated misconceptions when count >= 3', () => {
    expect(detectRepeatedMisconception(3)).toBe(true);
    expect(detectRepeatedMisconception(4)).toBe(true);
    expect(detectRepeatedMisconception(2)).toBe(false);
  });

  it('creates signal on mastery regression', async () => {
    prisma.learningSignal.create.mockResolvedValue({ id: 'sig-1' });

    const result = await service.processMastery({
      learnerId: 'student-1',
      tenantId: 'tenant-school',
      conceptId: 'concept-quadratics',
      previousMastery: 0.8,
      currentMastery: 0.5,
      evidenceId: 'ev-1',
    });

    expect(result).toBeDefined();
    expect(prisma.learningSignal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'MASTERY_DECLINE',
          learnerId: 'student-1',
        }),
      }),
    );
  });
});
