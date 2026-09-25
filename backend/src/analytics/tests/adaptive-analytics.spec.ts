import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdaptiveAnalyticsService } from '../adaptive/adaptive-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdaptiveAnalyticsService (LKC-8)', () => {
  let service: AdaptiveAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      adaptiveDecision: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      teacherAdaptiveOverride: {
        count: jest.fn(),
      },
      learnerKnowledgeState: {
        findUnique: jest.fn(),
      },
      learningEvidenceLog: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdaptiveAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdaptiveAnalyticsService>(AdaptiveAnalyticsService);
  });

  it('should aggregate adaptive metrics and calculate teacher override rate', async () => {
    mockPrisma.adaptiveDecision.findMany.mockResolvedValue([
      { action: 'REMEDIATE', status: 'EXECUTED' },
      { action: 'REMEDIATE', status: 'ACTIVE' },
      { action: 'ADVANCE', status: 'EXECUTED' },
      { action: 'REVIEW', status: 'EXECUTED' },
      { action: 'TEACHER_INTERVENTION', status: 'ACTIVE' },
    ]);

    mockPrisma.teacherAdaptiveOverride.count.mockResolvedValue(1);

    const metrics = await service.getAdaptiveMetrics('tenant-1');

    expect(metrics.totalDecisions).toBe(5);
    expect(metrics.remediationCount).toBe(2);
    expect(metrics.advancementCount).toBe(1);
    expect(metrics.reviewCount).toBe(1);
    expect(metrics.teacherInterventionCount).toBe(1);
    expect(metrics.teacherOverrideCount).toBe(1);
    expect(metrics.teacherOverrideRate).toBe(0.2); // 1 / 5 = 0.200
  });

  it('should reconstruct a complete decision audit trace with learner state and evidence', async () => {
    const decisionDate = new Date();
    mockPrisma.adaptiveDecision.findFirst.mockResolvedValue({
      id: 'dec-1',
      learnerId: 'learner-1',
      targetKnowledgeId: 'k-1',
      action: 'REMEDIATE',
      reasonCode: 'LOW_ACCURACY',
      reasonMessage: 'Learner struggled on 3 attempts',
      priority: 8,
      confidence: 0.85,
      policyVersion: 'standard-adaptive-v1',
      status: 'EXECUTED',
      createdAt: decisionDate,
      executedAt: decisionDate,
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      masteryLevel: 0.35,
      confidence: 0.5,
      status: 'STRUGGLING',
    });

    mockPrisma.learningEvidenceLog.findMany.mockResolvedValue([
      {
        id: 'ev-1',
        accuracy: 0.2,
        attemptNumber: 1,
        hintCount: 3,
        createdAt: decisionDate,
      },
      {
        id: 'ev-2',
        accuracy: 0.3,
        attemptNumber: 2,
        hintCount: 2,
        createdAt: decisionDate,
      },
    ]);

    const trace = await service.getDecisionAuditTrace('dec-1', 'tenant-1');

    expect(trace.decisionId).toBe('dec-1');
    expect(trace.learnerId).toBe('learner-1');
    expect(trace.targetKnowledgeId).toBe('k-1');
    expect(trace.action).toBe('REMEDIATE');
    expect(trace.reasonCode).toBe('LOW_ACCURACY');
    expect(trace.learnerState).toBeDefined();
    expect(trace.learnerState?.masteryLevel).toBe(0.35);
    expect(trace.learnerState?.status).toBe('STRUGGLING');
    expect(trace.supportingEvidence).toHaveLength(2);
    expect(trace.supportingEvidence[0].hintCount).toBe(3);
  });

  it('should throw NotFoundException when decision is not found', async () => {
    mockPrisma.adaptiveDecision.findFirst.mockResolvedValue(null);

    await expect(service.getDecisionAuditTrace('missing-dec', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
