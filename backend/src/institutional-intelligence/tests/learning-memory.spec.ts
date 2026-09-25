import { Test, TestingModule } from '@nestjs/testing';
import { LearningMemoryService } from '../services/learning-memory.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LearningMemoryService & Conflict Resolution (LKC-12)', () => {
  let service: LearningMemoryService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learningMemory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningMemoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LearningMemoryService>(LearningMemoryService);
  });

  it('should store an institutional learning memory with evidence references', async () => {
    mockPrisma.learningMemory.create.mockImplementation((args) =>
      Promise.resolve({ id: 'mem-1', ...args.data }),
    );

    const memory = await service.createMemory(
      {
        memoryType: 'INTERVENTION_EFFECTIVENESS',
        statement: 'Step-by-step scaffolding reliably resolves linear equations struggle',
        confidence: 0.88,
        evidenceReferences: ['e101', 'e102'],
      },
      'tenant-1',
    );

    expect(memory.id).toBe('mem-1');
    expect(memory.status).toBe('ACTIVE');
    expect(memory.evidenceReferences.length).toBe(2);
    expect(memory.expiresAt).toBeDefined();
  });

  it('CONFLICT HANDLING: should reduce confidence and transition to REVALIDATING on conflicting evidence', async () => {
    mockPrisma.learningMemory.findFirst.mockResolvedValue({
      id: 'mem-1',
      confidence: 0.85,
      status: 'ACTIVE',
      evidenceReferences: ['e101'],
    });

    mockPrisma.learningMemory.update.mockImplementation((args) =>
      Promise.resolve({ id: 'mem-1', ...args.data }),
    );

    const updated = await service.handleConflictingEvidence('mem-1', 'cohort_regression_q3', 0.25, 'tenant-1');
    expect(updated.confidence).toBe(0.60);
    expect(updated.status).toBe('REVALIDATING');
    expect(updated.evidenceReferences).toContain('conflict:cohort_regression_q3');
  });

  it('CONFLICT HANDLING: should expire memory when confidence drops below 0.5', async () => {
    mockPrisma.learningMemory.findFirst.mockResolvedValue({
      id: 'mem-1',
      confidence: 0.60,
      status: 'REVALIDATING',
      evidenceReferences: ['e101'],
    });

    mockPrisma.learningMemory.update.mockImplementation((args) =>
      Promise.resolve({ id: 'mem-1', ...args.data }),
    );

    const updated = await service.handleConflictingEvidence('mem-1', 'second_regression', 0.25, 'tenant-1');
    expect(updated.confidence).toBe(0.35);
    expect(updated.status).toBe('EXPIRED');
  });

  it('should revalidate memory and increase confidence with supporting evidence', async () => {
    mockPrisma.learningMemory.findFirst.mockResolvedValue({
      id: 'mem-1',
      confidence: 0.60,
      status: 'REVALIDATING',
      evidenceReferences: ['e101'],
    });

    mockPrisma.learningMemory.update.mockImplementation((args) =>
      Promise.resolve({ id: 'mem-1', ...args.data }),
    );

    const revalidated = await service.revalidateMemory('mem-1', 'spring_cohort_success', 'tenant-1');
    expect(revalidated.confidence).toBe(0.70);
    expect(revalidated.status).toBe('ACTIVE');
    expect(revalidated.evidenceReferences).toContain('support:spring_cohort_success');
  });
});
