import { SnapshotService } from '../snapshots/snapshot.service';
import { SimulationPolicy } from '../policies/simulation-policy';
import { PrismaService } from '../../prisma/prisma.service';

describe('SnapshotEngine (LKC-15)', () => {
  let snapshotService: SnapshotService;
  let simulationPolicy: SimulationPolicy;
  let mockPrisma: any;

  beforeEach(() => {
    simulationPolicy = new SimulationPolicy();
    mockPrisma = {
      ecosystemTwinSnapshot: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'snap-101', ...data, createdAt: new Date() })),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    snapshotService = new SnapshotService(mockPrisma as unknown as PrismaService, simulationPolicy);
  });

  it('should compute deterministic SHA-256 checksum', () => {
    const timestamp = '2026-09-20T08:00:00.000Z';
    const checksum1 = snapshotService.computeChecksum(
      'tenant-1',
      'KV_2026_09',
      'CV_2026_09',
      'PV_2026_09',
      timestamp,
    );
    const checksum2 = snapshotService.computeChecksum(
      'tenant-1',
      'KV_2026_09',
      'CV_2026_09',
      'PV_2026_09',
      timestamp,
    );

    expect(checksum1).toBe(checksum2);
    expect(checksum1).toHaveLength(64);
  });

  it('should create a snapshot with SHA-256 checksum', async () => {
    const res = await snapshotService.createSnapshot({
      tenantId: 'tenant-1',
      knowledgeVersionSet: 'KV_2026_09',
      curriculumVersionSet: 'CV_2026_09',
      policyVersionSet: 'PV_2026_09',
    });

    expect(res.id).toBe('snap-101');
    expect(res.checksum).toBeDefined();
    expect(mockPrisma.ecosystemTwinSnapshot.create).toHaveBeenCalled();
  });

  it('should validate snapshot and verify checksum match', async () => {
    const now = new Date();
    const expectedChecksum = snapshotService.computeChecksum(
      'tenant-1',
      'KV_2026_09',
      'CV_2026_09',
      'PV_2026_09',
      now.toISOString(),
    );

    mockPrisma.ecosystemTwinSnapshot.findUnique.mockResolvedValue({
      id: 'snap-101',
      tenantId: 'tenant-1',
      snapshotTime: now,
      knowledgeVersionSet: 'KV_2026_09',
      curriculumVersionSet: 'CV_2026_09',
      policyVersionSet: 'PV_2026_09',
      learnerStateSnapshot: 'LS_1',
      assessmentVersionSet: 'AV_1',
      methodologyVersion: '1.0.0',
      checksum: expectedChecksum,
      createdAt: now,
    });

    const validation = await snapshotService.validateSnapshot('snap-101');
    expect(validation.valid).toBe(true);
    expect(validation.checksumValid).toBe(true);
    expect(validation.isStale).toBe(false);
  });

  it('should flag snapshot as stale when production version sets advance', async () => {
    const now = new Date();
    const expectedChecksum = snapshotService.computeChecksum(
      'tenant-1',
      'KV_2026_08', // Older version
      'CV_2026_09',
      'PV_2026_09',
      now.toISOString(),
    );

    mockPrisma.ecosystemTwinSnapshot.findUnique.mockResolvedValue({
      id: 'snap-old',
      tenantId: 'tenant-1',
      snapshotTime: now,
      knowledgeVersionSet: 'KV_2026_08',
      curriculumVersionSet: 'CV_2026_09',
      policyVersionSet: 'PV_2026_09',
      learnerStateSnapshot: 'LS_1',
      assessmentVersionSet: 'AV_1',
      methodologyVersion: '1.0.0',
      checksum: expectedChecksum,
      createdAt: now,
    });

    const validation = await snapshotService.validateSnapshot('snap-old');
    expect(validation.valid).toBe(false);
    expect(validation.checksumValid).toBe(true);
    expect(validation.isStale).toBe(true);
    expect(validation.reason).toContain('SNAPSHOT_STALE');
  });
});
