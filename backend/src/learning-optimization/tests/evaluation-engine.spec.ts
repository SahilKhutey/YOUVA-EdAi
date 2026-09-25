import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from '../services/evaluation.service';
import { OutcomeService } from '../services/outcome.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EvaluationService & Closed-Loop Feedback (LKC-11)', () => {
  let service: EvaluationService;
  let mockPrisma: any;
  let mockOutcomeService: any;

  beforeEach(async () => {
    mockPrisma = {
      improvementPlan: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    mockOutcomeService = {
      recordOutcome: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        { provide: OutcomeService, useValue: mockOutcomeService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
  });

  it('should classify as POSITIVE_SIGNAL and standardize plan when primary improves and guardrails hold', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-101',
      tenantId: 'tenant-1',
      baseline: JSON.stringify({ metric: 'accuracy', aggregation: 'RATE' }),
      successCriteria: JSON.stringify({
        primaryMetric: 'accuracy',
        targetDirection: 'INCREASE',
        targetValue: 0.75,
        minimumSampleSize: 15,
        evaluationWindowDays: 14,
        guardrailMetrics: [
          { metric: 'abandonment', acceptableTolerance: 0.05, targetDirection: 'DECREASE' },
        ],
      }),
    });

    const report = await service.evaluatePlan(
      {
        planId: 'plan-101',
        observedPrimaryValue: 0.82, // Baseline was 0.55 -> delta +0.27
        sampleSize: 40,
        observedGuardrails: { abandonment: 0.10 }, // Baseline was 0.12 -> decreased!
      },
      'tenant-1',
    );

    expect(report.classification).toBe('POSITIVE_SIGNAL');
    expect(report.allGuardrailsPassed).toBe(true);
    expect(report.canStandardize).toBe(true);
    expect(mockPrisma.improvementPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-101' },
      data: { status: 'COMPLETED' },
    });
  });

  it('should return INSUFFICIENT_DATA when sample size is below minimum threshold', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-101',
      tenantId: 'tenant-1',
      baseline: JSON.stringify({ metric: 'accuracy', aggregation: 'RATE' }),
      successCriteria: JSON.stringify({
        primaryMetric: 'accuracy',
        targetDirection: 'INCREASE',
        targetValue: 0.75,
        minimumSampleSize: 20,
        evaluationWindowDays: 14,
        guardrailMetrics: [],
      }),
    });

    const report = await service.evaluatePlan(
      {
        planId: 'plan-101',
        observedPrimaryValue: 0.85,
        sampleSize: 6, // Below minimum 20!
      },
      'tenant-1',
    );

    expect(report.classification).toBe('INSUFFICIENT_DATA');
    expect(report.canStandardize).toBe(false);
    expect(mockPrisma.improvementPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-101' },
      data: { status: 'EVALUATING' },
    });
  });

  it('should detect guardrail degradation and classify as MIXED_RESULT or NEGATIVE_SIGNAL', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-101',
      tenantId: 'tenant-1',
      baseline: JSON.stringify({ metric: 'accuracy', aggregation: 'RATE' }),
      successCriteria: JSON.stringify({
        primaryMetric: 'accuracy',
        targetDirection: 'INCREASE',
        targetValue: 0.75,
        minimumSampleSize: 15,
        evaluationWindowDays: 14,
        guardrailMetrics: [
          { metric: 'abandonment', acceptableTolerance: 0.05, targetDirection: 'DECREASE' },
        ],
      }),
    });

    const report = await service.evaluatePlan(
      {
        planId: 'plan-101',
        observedPrimaryValue: 0.80, // Primary improved
        sampleSize: 30,
        observedGuardrails: { abandonment: 0.35 }, // Baseline 0.12 -> increased to 0.35 (> tolerance 0.05)!
      },
      'tenant-1',
    );

    expect(report.allGuardrailsPassed).toBe(false);
    expect(report.canStandardize).toBe(false);
    expect(report.classification).toBe('MIXED_RESULT');
  });
});
