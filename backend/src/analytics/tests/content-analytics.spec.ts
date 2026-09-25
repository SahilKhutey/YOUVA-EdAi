import { Test, TestingModule } from '@nestjs/testing';
import { ContentAnalyticsService } from '../content/content-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ContentAnalyticsService (LKC-8)', () => {
  let service: ContentAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
      },
      knowledgeLearningSession: {
        findMany: jest.fn(),
      },
      learningEvidenceLog: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContentAnalyticsService>(ContentAnalyticsService);
  });

  it('should derive content analytics, version breakdown, and diagnostic quality signals', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-1',
      title: 'Quadratic Formula',
      versions: [
        { version: 1, reviewStatus: 'PUBLISHED' },
        { version: 2, reviewStatus: 'PUBLISHED' },
      ],
    });

    // 6 sessions: 5 completed, 1 abandoned -> completionRate = 5/6 = 0.83
    mockPrisma.knowledgeLearningSession.findMany.mockResolvedValue([
      { id: 's1', knowledgeVersionId: 'v1', completedAt: new Date() },
      { id: 's2', knowledgeVersionId: 'v1', completedAt: new Date() },
      { id: 's3', knowledgeVersionId: 'v1', completedAt: new Date() },
      { id: 's4', knowledgeVersionId: 'v2', completedAt: new Date() },
      { id: 's5', knowledgeVersionId: 'v2', completedAt: new Date() },
      { id: 's6', knowledgeVersionId: 'v2', completedAt: null },
    ]);

    // 12 evidence logs: high support demand (30 hints / 6 sessions = 5.0 hints/session)
    const logs = Array.from({ length: 12 }, (_, i) => ({
      id: `e${i}`,
      accuracy: 0.4,
      hintCount: i < 6 ? 5 : 0, // total hints = 30
    }));
    mockPrisma.learningEvidenceLog.findMany.mockResolvedValue(logs);

    const result = await service.getContentAnalytics('k-1', 'tenant-1');

    expect(result.knowledgeId).toBe('k-1');
    expect(result.title).toBe('Quadratic Formula');
    expect(result.totalSessions).toBe(6);
    expect(result.completedSessions).toBe(5);
    expect(result.completionRate).toBe(0.83);
    expect(result.totalAttempts).toBe(12);
    expect(result.averageAccuracy).toBe(0.4);
    expect(result.totalHintsRequested).toBe(30);
    expect(result.hintsPerSession).toBe(5);

    // Diagnostic quality signals
    expect(result.qualitySignals).toContain('HIGH_SUPPORT_DEMAND');
    expect(result.qualitySignals).toContain('HIGH_ERROR_RATE');
    expect(result.qualitySignals).not.toContain('LOW_COMPLETION');
    expect(result.qualitySignals).not.toContain('STRONG_PERFORMANCE');

    // Version breakdown
    expect(result.versionBreakdown.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect STRONG_PERFORMANCE signal when completion and accuracy are high', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-strong',
      title: 'Intro to Variables',
      versions: [{ version: 1, reviewStatus: 'PUBLISHED' }],
    });

    mockPrisma.knowledgeLearningSession.findMany.mockResolvedValue([
      { id: 's1', completedAt: new Date() },
      { id: 's2', completedAt: new Date() },
      { id: 's3', completedAt: new Date() },
      { id: 's4', completedAt: new Date() },
      { id: 's5', completedAt: new Date() },
    ]);

    mockPrisma.learningEvidenceLog.findMany.mockResolvedValue([
      { id: 'e1', accuracy: 0.9, hintCount: 0 },
      { id: 'e2', accuracy: 0.85, hintCount: 0 },
    ]);

    const result = await service.getContentAnalytics('k-strong', 'tenant-1');
    expect(result.qualitySignals).toContain('STRONG_PERFORMANCE');
  });
});
