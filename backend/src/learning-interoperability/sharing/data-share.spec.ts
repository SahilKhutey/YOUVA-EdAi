import { LearningExportService } from './learning-export.service';

describe('LearningExportService', () => {
  let service: LearningExportService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningDataShare: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      passportAchievement: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new LearningExportService(prisma);
  });

  it('rejects missing share', async () => {
    prisma.learningDataShare.findFirst.mockResolvedValue(null);

    await expect(
      service.validateShare(
        'share-1',
        'learner-1',
      ),
    ).rejects.toThrow();
  });

  it('rejects expired share', async () => {
    prisma.learningDataShare.findFirst.mockResolvedValue({
      id: 'share-1',
      learnerId: 'learner-1',
      status: 'APPROVED',
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      service.validateShare(
        'share-1',
        'learner-1',
      ),
    ).rejects.toThrow('Learning data share has expired.');
  });

  it('accepts valid approved share within expiration period', async () => {
    const validShare = {
      id: 'share-valid',
      learnerId: 'learner-1',
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 60000),
      purpose: 'School transfer',
      recipientId: 'new-school-academy',
      scopeJson: JSON.stringify(['PROFILE_MINIMAL', 'MASTERY']),
    };
    prisma.learningDataShare.findFirst.mockResolvedValue(validShare);

    const result = await service.validateShare('share-valid', 'learner-1');
    expect(result.id).toBe('share-valid');
  });

  it('exports data according to minimal requested scope', async () => {
    const validShare = {
      id: 'share-scoped',
      learnerId: 'learner-1',
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 60000),
      purpose: 'Admission check',
      recipientId: 'partner-high-school',
      scopeJson: JSON.stringify(['PROFILE_MINIMAL', 'CREDENTIALS']),
    };
    prisma.learningDataShare.findFirst.mockResolvedValue(validShare);

    const bundle = await service.exportLearnerData('share-scoped', 'learner-1');
    expect(bundle.profile).toBeDefined();
    expect(bundle.credentials).toBeDefined();
    expect(bundle.mastery).toBeUndefined(); // Mastery was not in requested scope
  });
});
