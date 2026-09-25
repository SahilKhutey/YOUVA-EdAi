import { Test, TestingModule } from '@nestjs/testing';
import { CurriculumAnalyticsService } from '../curriculum/curriculum-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CurriculumAnalyticsService (LKC-8)', () => {
  let service: CurriculumAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurriculumAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CurriculumAnalyticsService>(CurriculumAnalyticsService);
  });

  it('should calculate coverage and identify bottlenecks with INVESTIGATE recommendation', async () => {
    mockPrisma.knowledgeObject.findMany.mockResolvedValue([
      {
        id: 'ko-1',
        title: 'Linear Equations',
        status: 'PUBLISHED',
        objectives: [{ id: 'obj-1' }],
        learnerStates: [
          { masteryLevel: 0.8, status: 'MASTERED' },
          { masteryLevel: 0.85, status: 'MASTERED' },
          { masteryLevel: 0.9, status: 'MASTERED' },
        ],
      },
      {
        id: 'ko-2',
        title: 'Quadratic Equations',
        status: 'PUBLISHED',
        objectives: [{ id: 'obj-2' }],
        learnerStates: [
          { masteryLevel: 0.3, status: 'STRUGGLING' },
          { masteryLevel: 0.4, status: 'DEVELOPING' },
          { masteryLevel: 0.7, status: 'MASTERED' },
        ],
      },
      {
        id: 'ko-3',
        title: 'Draft Calculus',
        status: 'DRAFT',
        objectives: [],
        learnerStates: [],
      },
    ]);

    const result = await service.getCurriculumAnalytics('subj-math', 'tenant-1');

    expect(result.curriculumId).toBe('subj-math');
    expect(result.totalConcepts).toBe(3);
    expect(result.publishedConcepts).toBe(2);
    expect(result.objectiveCoverageRate).toBe(0.67); // 2 out of 3 have objectives

    // Bottlenecks: ko-2 has 2 out of 3 learners struggling (<0.5) = 67% struggle rate
    expect(result.bottlenecks).toHaveLength(1);
    expect(result.bottlenecks[0].knowledgeId).toBe('ko-2');
    expect(result.bottlenecks[0].struggleRate).toBe(0.67);
    expect(result.bottlenecks[0].recommendation).toBe('INVESTIGATE');
    expect(result.bottlenecks[0].reason).toContain('High struggle rate');
  });
});
