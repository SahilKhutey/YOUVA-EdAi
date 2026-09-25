import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalyticsService } from '../ai/ai-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AiAnalyticsService (LKC-8)', () => {
  let service: AiAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      aiRequest: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiAnalyticsService>(AiAnalyticsService);
  });

  it('should return default metrics when there are no AI requests', async () => {
    mockPrisma.aiRequest.findMany.mockResolvedValue([]);

    const metrics = await service.getAiMetrics('tenant-1');

    expect(metrics.totalRequests).toBe(0);
    expect(metrics.successRate).toBe(1.0);
    expect(metrics.groundingComplianceRate).toBe(1.0);
    expect(metrics.safetyComplianceRate).toBe(1.0);
    expect(metrics.evaluationStatus).toBe('PASS');
  });

  it('should calculate grounding and safety compliance and determine evaluation status', async () => {
    mockPrisma.aiRequest.findMany.mockResolvedValue([
      {
        id: 'r1',
        capability: 'QUESTION_GENERATION',
        status: 'COMPLETED',
        provenance: [
          { groundingScore: 0.85, safetyStatus: 'PASSED' },
          { groundingScore: 0.70, safetyStatus: 'PASSED' },
        ],
      },
      {
        id: 'r2',
        capability: 'EXPLANATION',
        status: 'COMPLETED',
        provenance: [
          { groundingScore: 0.40, safetyStatus: 'PASSED' }, // Low grounding (< 0.65)
        ],
      },
      {
        id: 'r3',
        capability: 'HINT_GENERATION',
        status: 'FAILED',
        provenance: [
          { groundingScore: 0.90, safetyStatus: 'PASSED' },
        ],
      },
    ]);

    const metrics = await service.getAiMetrics('tenant-1');

    expect(metrics.totalRequests).toBe(3);
    expect(metrics.successRate).toBe(0.667); // 2 completed / 3
    expect(metrics.requestsByCapability['QUESTION_GENERATION']).toBe(1);
    expect(metrics.requestsByCapability['EXPLANATION']).toBe(1);
    expect(metrics.requestsByCapability['HINT_GENERATION']).toBe(1);

    // Provenance: 4 total, 3 with score >= 0.65 (0.85, 0.70, 0.90) -> 3/4 = 0.75
    expect(metrics.groundingComplianceRate).toBe(0.75);
    expect(metrics.safetyComplianceRate).toBe(1.0);
    // Grounding between 0.70 and 0.85 -> status is WARNING
    expect(metrics.evaluationStatus).toBe('WARNING');
  });

  it('should execute pedagogical regression evaluation suite', async () => {
    const result = await service.runEvaluationRegression('CUSTOM_SUITE', 'tenant-1');

    expect(result.suiteName).toBe('CUSTOM_SUITE');
    expect(result.totalTests).toBe(3);
    expect(result.passed).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.status).toBe('PASS');
    expect(result.averageGroundingScore).toBeGreaterThanOrEqual(0.85);
  });
});
