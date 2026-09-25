import { Test, TestingModule } from '@nestjs/testing';
import { ExperimentService } from '../services/experiment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExperimentService Safety & Lifecycle (LKC-10)', () => {
  let service: ExperimentService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      intelligenceExperiment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExperimentService>(ExperimentService);
  });

  it('should create an experiment in DRAFT status', async () => {
    mockPrisma.intelligenceExperiment.create.mockImplementation((args) =>
      Promise.resolve({ id: 'exp-1', ...args.data }),
    );

    const exp = await service.createExperiment({
      name: 'Linear Equations Scaffold Test',
      hypothesis: 'Adding interactive visual scaffolds increases first-try mastery.',
      targetType: 'KNOWLEDGE_OBJECT',
      targetId: 'ko-linear',
      primaryMetric: 'accuracy',
      ownerId: 'teacher-1',
    });

    expect(exp.id).toBe('exp-1');
    expect(exp.status).toBe('DRAFT');
  });

  it('should submit DRAFT experiment for approval', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'DRAFT',
    });
    mockPrisma.intelligenceExperiment.update.mockResolvedValue({
      id: 'exp-1',
      status: 'PENDING_APPROVAL',
    });

    const submitted = await service.submitForApproval('exp-1');
    expect(submitted.status).toBe('PENDING_APPROVAL');
  });

  it('should reject submission if experiment is not in DRAFT status', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'APPROVED',
    });

    await expect(service.submitForApproval('exp-1')).rejects.toThrow(BadRequestException);
  });

  it('should approve experiment with authorized governance ID', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'PENDING_APPROVAL',
    });
    mockPrisma.intelligenceExperiment.update.mockResolvedValue({
      id: 'exp-1',
      status: 'APPROVED',
      approvedBy: 'lead-teacher-42',
    });

    const approved = await service.approveExperiment('exp-1', 'lead-teacher-42');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('lead-teacher-42');
  });

  it('SAFETY INVARIANT: should throw ForbiddenException when starting an unapproved experiment', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'PENDING_APPROVAL',
    });

    await expect(service.startExperiment('exp-1')).rejects.toThrow(ForbiddenException);
    await expect(service.startExperiment('exp-1')).rejects.toThrow(/Safety Invariant/);
  });

  it('should allow starting an APPROVED experiment', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'APPROVED',
    });
    mockPrisma.intelligenceExperiment.update.mockResolvedValue({
      id: 'exp-1',
      status: 'RUNNING',
      startAt: new Date(),
    });

    const started = await service.startExperiment('exp-1');
    expect(started.status).toBe('RUNNING');
  });

  it('should pause a running experiment', async () => {
    mockPrisma.intelligenceExperiment.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.pauseExperiment('exp-1');
    expect(result.count).toBe(1);
    expect(mockPrisma.intelligenceExperiment.updateMany).toHaveBeenCalledWith({
      where: { id: 'exp-1', tenantId: 'default-tenant', status: 'RUNNING' },
      data: { status: 'PAUSED' },
    });
  });

  it('should complete experiment and calculate comparison metrics', async () => {
    mockPrisma.intelligenceExperiment.findFirst.mockResolvedValue({
      id: 'exp-1',
      status: 'RUNNING',
    });
    mockPrisma.intelligenceExperiment.update.mockImplementation((args) =>
      Promise.resolve({ id: 'exp-1', ...args.data }),
    );

    const completed = await service.completeExperiment('exp-1');
    expect(completed.status).toBe('COMPLETED');
    expect(completed.metrics).toBeDefined();
    const metrics = JSON.parse(completed.metrics);
    expect(metrics.statisticallySignificant).toBe(true);
    expect(metrics.relativeImprovement).toBe('+20.6%');
  });
});
