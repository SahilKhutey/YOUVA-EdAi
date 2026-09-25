import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from '../services/execution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionPolicy, ActionRiskClass } from '../policies/execution-policy';

describe('ExecutionService & Idempotency (LKC-11)', () => {
  let service: ExecutionService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      improvementPlan: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      improvementAction: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      improvementExecution: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      knowledgeObject: {
        findFirst: jest.fn(),
      },
      knowledgeVersion: {
        create: jest.fn(),
      },
      learningLineage: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  it('IDEMPOTENCY: should return existing execution if already completed with identical key', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      status: 'APPROVED',
      targetId: 'ko-1',
    });

    mockPrisma.improvementAction.findFirst.mockResolvedValue({
      id: 'act-1',
      planId: 'plan-1',
      type: 'ADD_EXAMPLE',
      executionMode: 'HUMAN',
      requiresApproval: true,
      status: 'COMPLETED',
    });

    // Existing execution already marked COMPLETED
    mockPrisma.improvementExecution.findUnique.mockResolvedValue({
      id: 'exec-1',
      planId: 'plan-1',
      actionId: 'act-1',
      status: 'COMPLETED',
      executionKey: 'tenant-1:plan-1:act-1:v1',
    });

    const result = await service.executeAction(
      {
        planId: 'plan-1',
        actionId: 'act-1',
        actorType: 'TEACHER',
        actorId: 'teacher-1',
        executionVersion: 1,
      },
      'tenant-1',
    );

    expect(result.id).toBe('exec-1');
    expect(result.status).toBe('COMPLETED');
    // Verify no new execution or version was created
    expect(mockPrisma.improvementExecution.create).not.toHaveBeenCalled();
    expect(mockPrisma.knowledgeVersion.create).not.toHaveBeenCalled();
  });

  it('SAFETY INVARIANT: should throw ForbiddenException when executing Class D canonical change without approval', async () => {
    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      status: 'DRAFT', // Not approved!
    });

    mockPrisma.improvementAction.findFirst.mockResolvedValue({
      id: 'act-1',
      planId: 'plan-1',
      type: 'REVISE_KNOWLEDGE', // Class D
      executionMode: 'HUMAN',
      requiresApproval: true,
      status: 'PENDING',
    });

    await expect(
      service.executeAction(
        {
          planId: 'plan-1',
          actionId: 'act-1',
          actorType: 'TEACHER',
        },
        'tenant-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('POLICY ENFORCEMENT: should block Class D action in CONTROLLED_AUTOMATION mode without human', async () => {
    expect(() =>
      ExecutionPolicy.validateAuthorization(
        'REVISE_KNOWLEDGE',
        'CONTROLLED_AUTOMATION',
        true,
        true,
        'SYSTEM',
      ),
    ).toThrow(ForbiddenException);
  });
});
