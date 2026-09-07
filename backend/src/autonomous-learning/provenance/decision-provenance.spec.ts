import { DecisionProvenanceService } from './decision-provenance.service';

describe('DecisionProvenanceService', () => {
  let service: DecisionProvenanceService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      decisionProvenance: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      learningAction: {
        findUnique: jest.fn(),
      },
    };
    service = new DecisionProvenanceService(prisma);
  });

  it('hashes input deterministically using SHA-256', () => {
    const input1 = { a: 1, b: 2 };
    const input2 = { b: 2, a: 1 };
    const hash1 = service.hashInput(input1);
    const hash2 = service.hashInput(input2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });

  it('records decision provenance record', async () => {
    prisma.decisionProvenance.create.mockResolvedValue({ id: 'prov-1' });

    await service.recordProvenance({
      decisionId: 'dec-1',
      tenantId: 'tenant-1',
      actorType: 'AI_AGENT',
      policyVersion: 'P14.0',
      inputPayload: { action: 'RECOMMEND_PRACTICE' },
      decision: { status: 'ALLOWED' },
      evidenceIds: ['ev-1', 'ev-2'],
    });

    expect(prisma.decisionProvenance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decisionId: 'dec-1',
          tenantId: 'tenant-1',
          policyVersion: 'P14.0',
        }),
      }),
    );
  });
});
