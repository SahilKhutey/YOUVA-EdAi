import { Test, TestingModule } from '@nestjs/testing';
import { LearningPatternService } from '../services/learning-pattern.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LearningPatternService Lifecycle & Validation (LKC-12)', () => {
  let service: LearningPatternService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learningPattern: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningPatternService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LearningPatternService>(LearningPatternService);
  });

  it('should register a learning pattern as VALIDATED when evidenceCount >= 50', async () => {
    mockPrisma.learningPattern.upsert.mockImplementation((args) =>
      Promise.resolve({ id: 'pat-1', ...args.create }),
    );

    const pattern = await service.registerPattern(
      {
        patternKey: 'FRACTIONS_VISUAL_SCAFFOLD',
        statement: 'Visual fraction bars reduce denominator misconceptions by 40%',
        conceptScope: 'FRACTIONS',
        evidenceCount: 120, // >= 50
        methodologyVersion: 'PATTERN_V2',
      },
      'tenant-1',
    );

    expect(pattern.patternKey).toBe('FRACTIONS_VISUAL_SCAFFOLD');
    expect(pattern.status).toBe('VALIDATED');
    expect(pattern.confidence).toBeGreaterThanOrEqual(0.85);
    expect(pattern.methodologyVersion).toBe('PATTERN_V2');
  });

  it('should register pattern as CANDIDATE when evidenceCount < 50', async () => {
    mockPrisma.learningPattern.upsert.mockImplementation((args) =>
      Promise.resolve({ id: 'pat-2', ...args.create }),
    );

    const pattern = await service.registerPattern(
      {
        patternKey: 'ALGEBRA_CROSS_METHOD',
        statement: 'Cross method helps with factoring quadratics',
        conceptScope: 'ALGEBRA',
        evidenceCount: 18, // < 50
      },
      'tenant-1',
    );

    expect(pattern.status).toBe('CANDIDATE');
  });

  it('should revalidate an existing pattern with additional evidence', async () => {
    mockPrisma.learningPattern.findUnique.mockResolvedValue({
      id: 'pat-1',
      patternKey: 'FRACTIONS_VISUAL_SCAFFOLD',
      evidenceCount: 120,
      confidence: 0.85,
    });

    mockPrisma.learningPattern.update.mockImplementation((args) =>
      Promise.resolve({ id: 'pat-1', ...args.data }),
    );

    const revalidated = await service.revalidatePattern('FRACTIONS_VISUAL_SCAFFOLD', 80, 0.90);
    expect(revalidated.evidenceCount).toBe(200);
    expect(revalidated.confidence).toBeGreaterThan(0.85);
    expect(revalidated.status).toBe('VALIDATED');
  });

  it('should expire obsolete pattern', async () => {
    mockPrisma.learningPattern.update.mockResolvedValue({
      id: 'pat-1',
      status: 'EXPIRED',
    });

    const expired = await service.expirePattern('FRACTIONS_VISUAL_SCAFFOLD');
    expect(expired.status).toBe('EXPIRED');
  });
});
