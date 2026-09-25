import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from '../services/recommendation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RecommendationService (LKC-10)', () => {
  let service: RecommendationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learningInsight: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      improvementOpportunity: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      improvementRecommendation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  it('should derive opportunity and recommendation from confirmed insight with human approval enforced', async () => {
    mockPrisma.learningInsight.findUnique.mockResolvedValue({
      id: 'ins-101',
      type: 'KNOWLEDGE_DIFFICULTY',
      scope: 'KNOWLEDGE',
      entityId: 'ko-linear',
      title: 'High Difficulty Barrier',
      summary: '60% incorrect attempts',
      evidenceIds: ['e1', 'e2'],
      confidence: 0.88,
      severity: 'HIGH',
    });

    mockPrisma.improvementOpportunity.findFirst.mockResolvedValue(null);
    mockPrisma.improvementOpportunity.create.mockResolvedValue({
      id: 'opp-101',
      type: 'WORKED_EXAMPLE',
      priority: 80.0,
    });

    mockPrisma.improvementRecommendation.create.mockImplementation((args) =>
      Promise.resolve({ id: 'rec-101', ...args.data }),
    );

    const rec = await service.generateRecommendationsForInsight('ins-101', 'tenant-1');

    expect(rec.id).toBe('rec-101');
    expect(rec.actionType).toBe('ADD_EXAMPLE');
    expect(rec.requiresHumanApproval).toBe(true);
    expect(rec.status).toBe('PROPOSED');
    expect(mockPrisma.learningInsight.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ins-101' },
        data: { status: 'RECOMMENDED' },
      }),
    );
  });

  it('should accept recommendation transition status to ACCEPTED', async () => {
    mockPrisma.improvementRecommendation.findFirst.mockResolvedValue({
      id: 'rec-101',
      status: 'PROPOSED',
    });

    mockPrisma.improvementRecommendation.update.mockResolvedValue({
      id: 'rec-101',
      status: 'ACCEPTED',
    });

    const accepted = await service.acceptRecommendation('rec-101', 'tenant-1');
    expect(accepted.status).toBe('ACCEPTED');
  });

  it('should dismiss recommendation transition status to DISMISSED', async () => {
    mockPrisma.improvementRecommendation.findFirst.mockResolvedValue({
      id: 'rec-101',
      status: 'PROPOSED',
    });

    mockPrisma.improvementRecommendation.update.mockResolvedValue({
      id: 'rec-101',
      status: 'DISMISSED',
    });

    const dismissed = await service.dismissRecommendation('rec-101', 'tenant-1');
    expect(dismissed.status).toBe('DISMISSED');
  });
});
