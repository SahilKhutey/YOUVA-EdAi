import { ImprovementDiscoveryService } from '../discovery/improvement-discovery.service';
import { EvolutionPolicyService } from '../policies/evolution-policy.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImprovementDiscoveryService (LKC-16)', () => {
  let service: ImprovementDiscoveryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      improvementCandidate: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'cand-1', ...data, createdAt: new Date(), updatedAt: new Date() }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data, updatedAt: new Date() }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ImprovementDiscoveryService(
      mockPrisma as unknown as PrismaService,
      new EvolutionPolicyService(),
    );
  });

  it('should create an improvement candidate and assign appropriate Evolution Level', async () => {
    const candidate = await service.createCandidate({
      sourceType: 'INSIGHT',
      sourceIds: ['INSIGHT-01', 'INSIGHT-02'],
      targetType: 'CURRICULUM_PATH',
      targetId: 'PATH_CALCULUS_01',
      proposal: { action: 'REORDER_MODULE', newIndex: 2 },
      expectedBenefits: ['Reduce dropouts'],
      risks: ['Prerequisite sequencing'],
    });

    expect(candidate.id).toBe('cand-1');
    expect(candidate.evolutionLevel).toBe(3); // Educational level
    expect(candidate.status).toBe('DISCOVERED');
  });

  it('should validate candidate against policy and require simulation', async () => {
    mockPrisma.improvementCandidate.findUnique.mockResolvedValue({
      id: 'cand-1',
      tenantId: 'default-tenant',
      targetType: 'CURRICULUM_PATH',
      targetId: 'PATH_CALCULUS_01',
      evolutionLevel: 3,
      sourceIds: Array.from({ length: 12 }, (_, i) => `EVID-${i}`),
      status: 'DISCOVERED',
    });

    const result = await service.validateCandidate('cand-1');
    expect(result.valid).toBe(true);
    expect(result.policy.simulationRequired).toBe(true);
    expect(mockPrisma.improvementCandidate.update).toHaveBeenCalledWith({
      where: { id: 'cand-1' },
      data: { status: 'SIMULATION_REQUIRED' },
    });
  });
});
