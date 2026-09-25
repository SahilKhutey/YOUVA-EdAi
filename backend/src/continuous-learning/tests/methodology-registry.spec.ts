import { MethodologyRegistryService } from '../registry/methodology-registry.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('MethodologyRegistryService (LKC-16)', () => {
  let service: MethodologyRegistryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      methodologyVersion: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'meth-1', ...data, createdAt: new Date() }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data }),
        ),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new MethodologyRegistryService(mockPrisma as unknown as PrismaService);
  });

  it('should prevent duplicate methodology versions (version immutability)', async () => {
    mockPrisma.methodologyVersion.findFirst.mockResolvedValue({
      id: 'existing-1',
      name: 'MASTERY_EVALUATOR',
      version: '1.0.0',
    });

    await expect(
      service.createMethodology({
        name: 'MASTERY_EVALUATOR',
        version: '1.0.0',
        purpose: 'Duplicate',
        inputs: [],
        outputs: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should enforce valid promotion lifecycle and reject invalid direct jump to ACTIVE', async () => {
    mockPrisma.methodologyVersion.findUnique.mockResolvedValue({
      id: 'meth-exp',
      name: 'PERSONALIZATION_ENGINE',
      version: '2.0.0',
      status: 'EXPERIMENTAL',
    });

    // Directly promoting EXPERIMENTAL to ACTIVE is forbidden
    await expect(
      service.promoteMethodology('meth-exp', 'ACTIVE'),
    ).rejects.toThrow(BadRequestException);

    // Promoting EXPERIMENTAL to OFFLINE_VALIDATED is allowed
    await service.promoteMethodology('meth-exp', 'OFFLINE_VALIDATED');
    expect(mockPrisma.methodologyVersion.update).toHaveBeenCalledWith({
      where: { id: 'meth-exp' },
      data: { status: 'OFFLINE_VALIDATED' },
    });
  });

  it('should execute shadow mode comparison without mutating production state', async () => {
    mockPrisma.methodologyVersion.findUnique
      .mockResolvedValueOnce({ id: 'active-1', version: '1.0.0', status: 'ACTIVE' })
      .mockResolvedValueOnce({ id: 'shadow-1', version: '2.0.0', status: 'SHADOW' });

    const result = await service.runShadowComparison('active-1', 'shadow-1', { learnerId: 'L1' });

    expect(result.activeDecision).toBeDefined();
    expect(result.shadowDecision).toBeDefined();
    expect(result.difference).toBe(true);
    expect(result.explanation).toContain('Shadow Disagreement');
  });
});
