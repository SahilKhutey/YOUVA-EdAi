import { UnifiedLearnerSnapshotService } from './unified-learner-snapshot.service';
import { nextSnapshotVersion } from './ulr.types';

describe('UnifiedLearnerSnapshotService', () => {
  let service: UnifiedLearnerSnapshotService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      unifiedLearnerSnapshot: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      learnerCompetency: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new UnifiedLearnerSnapshotService(prisma);
  });

  it('returns the latest snapshot', async () => {
    prisma.unifiedLearnerSnapshot.findFirst.mockResolvedValue({
      learnerId: 'learner-1',
      tenantId: 'tenant-1',
      version: 4,
    });

    const result = await service.getLatest('learner-1', 'tenant-1');
    expect(result?.version).toBe(4);
  });

  it('filters snapshots by tenant', async () => {
    await service.getLatest('learner-1', 'tenant-a');

    expect(prisma.unifiedLearnerSnapshot.findFirst).toHaveBeenCalledWith({
      where: {
        learnerId: 'learner-1',
        tenantId: 'tenant-a',
      },
      orderBy: {
        version: 'desc',
      },
    });
  });

  it('computes next snapshot version correctly', () => {
    expect(nextSnapshotVersion(null)).toBe(1);
    expect(nextSnapshotVersion(4)).toBe(5);
  });
});
