import { Test, TestingModule } from '@nestjs/testing';
import { LearnerAnalyticsService } from '../learner/learner-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LearnerAnalyticsService (LKC-8)', () => {
  let service: LearnerAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learnerKnowledgeState: {
        findMany: jest.fn(),
      },
      learningEvidenceLog: {
        findMany: jest.fn(),
      },
      knowledgeLearningSession: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearnerAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LearnerAnalyticsService>(LearnerAnalyticsService);
  });

  it('should compute learner overview and separate activity from mastery', async () => {
    mockPrisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        knowledgeObjectId: 'k-1',
        masteryLevel: 0.9,
        confidence: 0.85,
        status: 'MASTERED',
        attempts: 5,
        correctAttempts: 4,
        nextReviewAt: null,
      },
      {
        knowledgeObjectId: 'k-2',
        masteryLevel: 0.5,
        confidence: 0.6,
        status: 'STRUGGLING',
        attempts: 3,
        correctAttempts: 1,
        nextReviewAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Review due
      },
    ]);

    mockPrisma.learningEvidenceLog.findMany.mockResolvedValue([
      { accuracy: 0.8, hintCount: 1, createdAt: new Date() },
      { accuracy: 0.4, hintCount: 2, createdAt: new Date() },
    ]);

    mockPrisma.knowledgeLearningSession.count.mockResolvedValue(4);

    const overview = await service.getLearnerOverview('learner-1', 'tenant-1');

    expect(overview.activeKnowledgeCount).toBe(2);
    expect(overview.masteredKnowledgeCount).toBe(1);
    expect(overview.developingKnowledgeCount).toBe(1);
    expect(overview.reviewDueCount).toBe(1);
    expect(overview.remediationCount).toBe(1);
    expect(overview.objectiveProgress).toBe(0.7); // (0.9 + 0.5) / 2

    // Verify activity summary distinguishes activity from mastery
    expect(overview.activitySummary.totalSessions).toBe(4);
    expect(overview.activitySummary.totalAttempts).toBe(2);
    expect(overview.activitySummary.totalHintsRequested).toBe(3);
    expect(overview.calculationVersion).toBe('mastery-rate-v1');
  });
});
