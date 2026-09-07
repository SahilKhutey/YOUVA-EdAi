import { OfflineService } from './offline.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OfflineService & Evidence Sync', () => {
  let service: OfflineService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      learningEvidenceLog: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ev-1', ...data })),
      },
    };

    service = new OfflineService(mockPrisma);
  });

  describe('createPackage', () => {
    it('creates offline learning package with checksum and expiry', async () => {
      const pkg = await service.createPackage('learner-1', [
        {
          activityId: 'act-1',
          topicId: 'topic-fractions',
          title: 'Fraction Practice',
          type: 'PRACTICE',
          contentSnapshot: '{}',
        },
      ]);

      expect(pkg.learnerId).toBe('learner-1');
      expect(pkg.version).toBe(1);
      expect(pkg.activities).toHaveLength(1);
      expect(pkg.checksum).toBeDefined();
      expect(new Date(pkg.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('syncEvidence', () => {
    it('rejects sync attempt when calling user does not match package learner', async () => {
      await expect(
        service.syncEvidence('user-intruder', {
          packageId: 'pkg-1',
          learnerId: 'user-student',
          checksum: 'hash',
          expiresAt: new Date(Date.now() + 100000).toISOString(),
          evidenceList: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects sync for expired package', async () => {
      await expect(
        service.syncEvidence('user-student', {
          packageId: 'pkg-1',
          learnerId: 'user-student',
          checksum: 'hash',
          expiresAt: new Date(Date.now() - 100000).toISOString(), // Expired
          evidenceList: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deduplicates duplicate evidence and stores new evidence immutably', async () => {
      mockPrisma.learningEvidenceLog.findUnique.mockImplementation(({ where }) => {
        if (where.idempotencyKey === 'key-dup') {
          return Promise.resolve({ id: 'existing-log' });
        }
        return Promise.resolve(null);
      });

      const result = await service.syncEvidence('user-student', {
        packageId: 'pkg-1',
        learnerId: 'user-student',
        checksum: 'valid-checksum',
        expiresAt: new Date(Date.now() + 100000).toISOString(),
        evidenceList: [
          {
            idempotencyKey: 'key-dup',
            topicId: 'topic-1',
            accuracy: 1.0,
            completedAt: new Date().toISOString(),
          },
          {
            idempotencyKey: 'key-new',
            topicId: 'topic-1',
            accuracy: 0.8,
            completedAt: new Date().toISOString(),
          },
        ],
      });

      expect(result.syncedCount).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(mockPrisma.learningEvidenceLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.learningEvidenceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          idempotencyKey: 'key-new',
          userId: 'user-student',
          accuracy: 0.8,
        }),
      });
    });
  });
});
