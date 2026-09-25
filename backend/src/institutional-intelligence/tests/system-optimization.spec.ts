import { Test, TestingModule } from '@nestjs/testing';
import { SystemOptimizationService } from '../services/system-optimization.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('SystemOptimizationService & Governance (LKC-12)', () => {
  let service: SystemOptimizationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      systemOptimizationPlan: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemOptimizationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SystemOptimizationService>(SystemOptimizationService);
  });

  it('should create a systemic optimization plan in DRAFT status', async () => {
    mockPrisma.systemOptimizationPlan.create.mockImplementation((args) =>
      Promise.resolve({ id: 'sys-plan-1', ...args.data }),
    );

    const plan = await service.createPlan(
      {
        objective: 'Resolve systemic prerequisite failure in Algebra across 8 courses',
        ownerId: 'admin-1',
        actions: [
          {
            id: 'act-1',
            type: 'REVIEW_PREREQUISITE',
            targetCourseIds: ['c1', 'c2'],
            targetKnowledgeIds: ['ko-linear'],
            description: 'Align prerequisite sequencing in course syllabi',
            status: 'PENDING',
          },
        ],
      },
      'tenant-1',
    );

    expect(plan.id).toBe('sys-plan-1');
    expect(plan.status).toBe('DRAFT');
    expect(plan.actions.length).toBe(1);
  });

  it('should submit and approve systemic optimization plan', async () => {
    mockPrisma.systemOptimizationPlan.findFirst
      .mockResolvedValueOnce({ id: 'sys-plan-1', status: 'DRAFT' })
      .mockResolvedValueOnce({ id: 'sys-plan-1', status: 'PENDING_APPROVAL' });

    mockPrisma.systemOptimizationPlan.update
      .mockResolvedValueOnce({ id: 'sys-plan-1', status: 'PENDING_APPROVAL' })
      .mockResolvedValueOnce({ id: 'sys-plan-1', status: 'APPROVED', approvedBy: 'chief-academic-officer' });

    const submitted = await service.submitPlan('sys-plan-1', 'tenant-1');
    expect(submitted.status).toBe('PENDING_APPROVAL');

    const approved = await service.approvePlan('sys-plan-1', 'chief-academic-officer', 'tenant-1');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('chief-academic-officer');
  });

  it('SAFETY INVARIANT: should reject execution of unapproved systemic plan', async () => {
    mockPrisma.systemOptimizationPlan.findFirst.mockResolvedValue({
      id: 'sys-plan-1',
      status: 'PENDING_APPROVAL', // Not APPROVED!
    });

    await expect(service.executePlan('sys-plan-1', 'tenant-1')).rejects.toThrow(ForbiddenException);
  });

  it('should execute APPROVED plan and mark actions EXECUTED', async () => {
    mockPrisma.systemOptimizationPlan.findFirst.mockResolvedValue({
      id: 'sys-plan-1',
      status: 'APPROVED',
      actionsJson: JSON.stringify([
        { id: 'act-1', type: 'REVIEW_PREREQUISITE', status: 'PENDING' },
      ]),
    });

    mockPrisma.systemOptimizationPlan.update.mockImplementation((args) =>
      Promise.resolve({ id: 'sys-plan-1', ...args.data }),
    );

    const executed = await service.executePlan('sys-plan-1', 'tenant-1');
    expect(executed.status).toBe('COMPLETED');
    const actions = JSON.parse(executed.actionsJson);
    expect(actions[0].status).toBe('EXECUTED');
  });
});
