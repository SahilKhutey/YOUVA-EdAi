import { AICostService } from './ai-cost.service';

describe('AICostService', () => {
  let service: AICostService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      aIUsageRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new AICostService(prismaMock as any);
  });

  describe('calculateCost', () => {
    it('calculates USD cost from input and output tokens', () => {
      // 10,000 input tokens * $0.0015 / 1k = $0.015
      // 5,000 output tokens * $0.0020 / 1k = $0.010
      // Total = $0.025
      const cost = service.calculateCost(10000, 5000);
      expect(cost).toBe(0.025);
    });
  });

  describe('recordUsage', () => {
    it('persists record with computed cost in USD', async () => {
      prismaMock.aIUsageRecord.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'rec-1', ...data }),
      );

      const record = await service.recordUsage({
        tenantId: 'school-1',
        learnerId: 'learner-1',
        agentId: 'agent-tutor',
        inputTokens: 2000,
        outputTokens: 1000,
        latencyMs: 340,
      });

      expect(record.estimatedCost).toBe(0.005);
      expect(record.currency).toBe('USD');
      expect(prismaMock.aIUsageRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inputTokens: 2000,
            outputTokens: 1000,
            estimatedCost: 0.005,
          }),
        }),
      );
    });
  });

  describe('checkBudgetState', () => {
    it('returns OK when budget consumption is below 80%', async () => {
      prismaMock.aIUsageRecord.findMany.mockResolvedValue([
        { estimatedCost: 200.0 },
        { estimatedCost: 150.0 },
      ]);

      const report = await service.checkBudgetState('school-1', 1000.0);

      expect(report.totalSpent).toBe(350.0);
      expect(report.percentUsed).toBe(35.0);
      expect(report.state).toBe('OK');
    });

    it('returns WARNING when budget consumption is between 80% and 99.9%', async () => {
      prismaMock.aIUsageRecord.findMany.mockResolvedValue([
        { estimatedCost: 500.0 },
        { estimatedCost: 350.0 },
      ]);

      const report = await service.checkBudgetState('school-1', 1000.0);

      expect(report.totalSpent).toBe(850.0);
      expect(report.percentUsed).toBe(85.0);
      expect(report.state).toBe('WARNING');
    });

    it('returns EXCEEDED when budget consumption hits or exceeds 100%', async () => {
      prismaMock.aIUsageRecord.findMany.mockResolvedValue([
        { estimatedCost: 600.0 },
        { estimatedCost: 450.0 },
      ]);

      const report = await service.checkBudgetState('school-1', 1000.0);

      expect(report.totalSpent).toBe(1050.0);
      expect(report.percentUsed).toBe(105.0);
      expect(report.state).toBe('EXCEEDED');
    });
  });
});
