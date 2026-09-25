import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlannerService } from '../services/action-planner.service';
import { ImprovementOrchestratorService } from '../services/improvement-orchestrator.service';
import { ExecutionService } from '../services/execution.service';
import { EvaluationService } from '../services/evaluation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ImprovementPlan Lifecycle & Creation (LKC-11)', () => {
  let actionPlanner: ActionPlannerService;
  let orchestrator: ImprovementOrchestratorService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      improvementPlan: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      improvementAction: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      improvementRecommendation: {
        findFirst: jest.fn(),
      },
      learningLineage: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionPlannerService,
        ImprovementOrchestratorService,
        { provide: ExecutionService, useValue: {} },
        { provide: EvaluationService, useValue: {} },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    actionPlanner = module.get<ActionPlannerService>(ActionPlannerService);
    orchestrator = module.get<ImprovementOrchestratorService>(ImprovementOrchestratorService);
  });

  it('should create a valid improvement plan in DRAFT status with default baseline and criteria', async () => {
    mockPrisma.improvementPlan.create.mockResolvedValue({
      id: 'plan-101',
      tenantId: 'tenant-1',
      targetType: 'KNOWLEDGE_OBJECT',
      targetId: 'ko-quadratics',
      objective: 'Improve first-attempt correctness on quadratic factoring',
      hypothesis: 'Adding visual geometric factoring models improves student retention',
      baseline: JSON.stringify({ metric: 'accuracy', aggregation: 'RATE', minimumSampleSize: 15 }),
      successCriteria: JSON.stringify({
        primaryMetric: 'accuracy',
        targetDirection: 'INCREASE',
        targetValue: 0.75,
        minimumSampleSize: 15,
        guardrailMetrics: [],
      }),
      policyVersion: '1.0.0',
      status: 'DRAFT',
      ownerId: 'teacher-1',
    });

    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-101',
      tenantId: 'tenant-1',
      targetType: 'KNOWLEDGE_OBJECT',
      targetId: 'ko-quadratics',
      objective: 'Improve first-attempt correctness on quadratic factoring',
      hypothesis: 'Adding visual geometric factoring models improves student retention',
      baseline: JSON.stringify({ metric: 'accuracy', aggregation: 'RATE', minimumSampleSize: 15 }),
      successCriteria: JSON.stringify({
        primaryMetric: 'accuracy',
        targetDirection: 'INCREASE',
        targetValue: 0.75,
        minimumSampleSize: 15,
        guardrailMetrics: [],
      }),
      policyVersion: '1.0.0',
      status: 'DRAFT',
      ownerId: 'teacher-1',
      actions: [],
      executions: [],
      outcomes: [],
    });

    const plan = await actionPlanner.createPlan(
      {
        targetType: 'KNOWLEDGE_OBJECT',
        targetId: 'ko-quadratics',
        objective: 'Improve first-attempt correctness on quadratic factoring',
        hypothesis: 'Adding visual geometric factoring models improves student retention',
        ownerId: 'teacher-1',
      },
      'tenant-1',
    );

    expect(plan.id).toBe('plan-101');
    expect(plan.status).toBe('DRAFT');
    expect(plan.baseline.metric).toBe('accuracy');
    expect(plan.successCriteria.targetValue).toBe(0.75);
  });

  it('should reject plan creation if objective or hypothesis is missing', async () => {
    await expect(
      actionPlanner.createPlan({
        targetType: 'KNOWLEDGE_OBJECT',
        targetId: 'ko-quadratics',
        objective: '',
        hypothesis: 'Some hypothesis',
        ownerId: 'teacher-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should advance plan through approval lifecycle (DRAFT -> PENDING_APPROVAL -> APPROVED)', async () => {
    mockPrisma.improvementPlan.findFirst
      .mockResolvedValueOnce({ id: 'plan-101', status: 'DRAFT' })
      .mockResolvedValueOnce({ id: 'plan-101', status: 'PENDING_APPROVAL' });

    mockPrisma.improvementPlan.update
      .mockResolvedValueOnce({ id: 'plan-101', status: 'PENDING_APPROVAL' })
      .mockResolvedValueOnce({ id: 'plan-101', status: 'APPROVED', approvedBy: 'lead-teacher' });

    const submitted = await orchestrator.submitForApproval('plan-101', 'tenant-1');
    expect(submitted.status).toBe('PENDING_APPROVAL');

    const approved = await orchestrator.approvePlan('plan-101', 'lead-teacher', 'tenant-1');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('lead-teacher');
  });

  it('should reject approval if plan is not in PENDING_APPROVAL status', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-101',
      status: 'DRAFT',
    });

    await expect(
      orchestrator.approvePlan('plan-101', 'lead-teacher', 'tenant-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
