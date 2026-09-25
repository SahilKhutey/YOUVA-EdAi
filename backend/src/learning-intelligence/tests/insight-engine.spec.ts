import { Test, TestingModule } from '@nestjs/testing';
import { InsightEngineService } from '../services/insight-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('InsightEngineService (LKC-10)', () => {
  let service: InsightEngineService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findUnique: jest.fn(),
      },
      learningInsight: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      learnerKnowledgeState: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InsightEngineService>(InsightEngineService);
  });

  it('should detect KNOWLEDGE_DIFFICULTY when error rates exceed threshold', async () => {
    // 10 evidence logs: 6 incorrect (<0.5) = 60%, 4 with retries (>2) = 40%
    const evidenceLogs = Array.from({ length: 10 }, (_, i) => ({
      id: `ev-${i}`,
      accuracy: i < 6 ? 0.3 : 0.9,
      attemptNumber: i < 4 ? 3 : 1,
      misconception: null,
      createdAt: new Date(),
    }));

    mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
      id: 'ko-quadratics',
      title: 'Quadratic Equations',
      evidenceLogs,
      learningSessions: [],
      learnerStates: [],
    });

    mockPrisma.learningInsight.findFirst.mockResolvedValue(null);
    mockPrisma.learningInsight.create.mockImplementation((args) =>
      Promise.resolve({ id: 'ins-1', ...args.data }),
    );

    const insights = await service.detectKnowledgeInsights('ko-quadratics', 'tenant-1');

    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('KNOWLEDGE_DIFFICULTY');
    expect(insights[0].severity).toBe('MEDIUM');
    expect(insights[0].confidence).toBeGreaterThanOrEqual(0.7);
    expect(mockPrisma.learningInsight.create).toHaveBeenCalled();
  });

  it('should enforce statistical safeguard: does NOT generate insights when sample size < 5', async () => {
    // Only 3 attempts
    const evidenceLogs = [
      { id: 'ev-1', accuracy: 0.1, attemptNumber: 3 },
      { id: 'ev-2', accuracy: 0.2, attemptNumber: 3 },
      { id: 'ev-3', accuracy: 0.1, attemptNumber: 3 },
    ];

    mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
      id: 'ko-sample-small',
      title: 'Small Sample Concept',
      evidenceLogs,
      learningSessions: [],
      learnerStates: [],
    });

    const insights = await service.detectKnowledgeInsights('ko-sample-small', 'tenant-1');

    expect(insights).toHaveLength(0);
    expect(mockPrisma.learningInsight.create).not.toHaveBeenCalled();
  });

  it('should deduplicate insights by updating existing active insight rather than creating a new one', async () => {
    const evidenceLogs = Array.from({ length: 8 }, (_, i) => ({
      id: `ev-${i}`,
      accuracy: 0.2,
      attemptNumber: 4,
      misconception: null,
    }));

    mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
      id: 'ko-quadratics',
      title: 'Quadratic Equations',
      evidenceLogs,
      learningSessions: [],
      learnerStates: [],
    });

    // Existing insight found in database
    mockPrisma.learningInsight.findFirst.mockResolvedValue({
      id: 'ins-existing-1',
      type: 'KNOWLEDGE_DIFFICULTY',
      evidenceIds: ['ev-old'],
    });

    mockPrisma.learningInsight.update.mockImplementation((args) =>
      Promise.resolve({ id: args.where.id, ...args.data }),
    );

    const insights = await service.detectKnowledgeInsights('ko-quadratics', 'tenant-1');

    expect(insights).toHaveLength(1);
    expect(mockPrisma.learningInsight.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ins-existing-1' },
      }),
    );
    expect(mockPrisma.learningInsight.create).not.toHaveBeenCalled();
  });
});
