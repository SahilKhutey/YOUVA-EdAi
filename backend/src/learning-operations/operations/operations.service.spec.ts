import { LearningOperationsService } from './learning-operations.service';

describe('LearningOperationsService — Idempotency & Tenant Isolation', () => {
  let service: LearningOperationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      operationsEventProcessing: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      learningSignal: {
        findMany: jest.fn(),
      },
      learningIntervention: {
        findMany: jest.fn(),
      },
      policyRecommendation: {
        findMany: jest.fn(),
      },
    };
    service = new LearningOperationsService(prisma);
  });

  it('does not process an event twice (idempotency gate)', async () => {
    // First invocation: event not in DB
    prisma.operationsEventProcessing.findUnique.mockResolvedValueOnce(null);
    prisma.operationsEventProcessing.create.mockResolvedValueOnce({ id: 'proc-1' });

    const first = await service.processOnce('event-1', 'TEST_EVENT');
    expect(first).toBe(true);
    expect(prisma.operationsEventProcessing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventId: 'event-1', status: 'PROCESSING' }),
    });

    // Second invocation: event already in DB
    prisma.operationsEventProcessing.findUnique.mockResolvedValueOnce({ id: 'proc-1' });
    const second = await service.processOnce('event-1', 'TEST_EVENT');
    expect(second).toBe(false);
  });

  it('does not return another tenant signals (strict tenant isolation)', async () => {
    prisma.learningSignal.findMany.mockResolvedValue([]);

    await service.getSignals({
      tenantId: 'tenant-a',
      userId: 'teacher-a',
    });

    expect(prisma.learningSignal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
        }),
      }),
    );
  });

  it('compiles Command Center KPIs', async () => {
    prisma.learningSignal.findMany.mockResolvedValue([
      { learnerId: 'l1', severity: 'HIGH', type: 'MASTERY_DECLINE' },
    ]);
    prisma.learningIntervention.findMany.mockResolvedValue([
      { status: 'PROPOSED', requiresTeacherApproval: true },
    ]);
    prisma.policyRecommendation.findMany.mockResolvedValue([]);

    const kpis = await service.getCommandCenterKPIs('tenant-a');
    expect(kpis.learnersNeedingReview).toBe(1);
    expect(kpis.interventionBacklog).toBe(1);
    expect(kpis.aiRecommendationsRequiringReview).toBe(1);
  });
});
