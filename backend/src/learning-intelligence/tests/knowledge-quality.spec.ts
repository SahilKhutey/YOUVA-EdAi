import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeQualityService } from '../services/knowledge-quality.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('KnowledgeQualityService (LKC-10)', () => {
  let service: KnowledgeQualityService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeQualityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KnowledgeQualityService>(KnowledgeQualityService);
  });

  it('should compute explainable 4-dimensional quality profile and diagnostic flags', async () => {
    mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
      id: 'ko-test',
      title: 'Chemical Reactions',
      learningSessions: [
        { id: 's1', status: 'COMPLETED' },
        { id: 's2', status: 'COMPLETED' },
        { id: 's3', status: 'ABANDONED' },
        { id: 's4', status: 'ABANDONED' },
      ], // Abandonment rate = 50% -> ELEVATED_ABANDONMENT
      evidenceLogs: [
        { id: 'e1', accuracy: 0.4, attemptNumber: 3, hintCount: 3 },
        { id: 'e2', accuracy: 0.5, attemptNumber: 4, hintCount: 2 },
        { id: 'e3', accuracy: 0.8, attemptNumber: 1, hintCount: 0 },
        { id: 'e4', accuracy: 0.3, attemptNumber: 3, hintCount: 3 },
      ], // 8 hints / 4 = 2.0 hints -> HIGH_SUPPORT_DEMAND, 3 of 4 > 2 retries = 75% -> REPEATED_CONCEPTUAL_ERRORS
      learnerStates: [
        { id: 'st1', status: 'STRUGGLING', masteryLevel: 0.3, struggleScore: 0.7 },
        { id: 'st2', status: 'STRUGGLING', masteryLevel: 0.4, struggleScore: 0.6 },
      ], // Struggle rate = 100% -> HIGH_STRUGGLE_RATE
    });

    const profile = await service.getQualityProfile('ko-test', 'tenant-1');

    expect(profile.knowledgeId).toBe('ko-test');
    expect(profile.title).toBe('Chemical Reactions');

    // Engagement
    expect(profile.engagement.abandonmentRate).toBe(0.5);
    expect(profile.engagement.completionRate).toBe(0.5);

    // Support
    expect(profile.support.hintRate).toBe(2.0);

    // Difficulty
    expect(profile.difficulty.struggleRate).toBe(1.0);
    expect(profile.difficulty.repeatedErrorRate).toBe(0.75);

    // Diagnostic flags
    expect(profile.flags).toContain('ELEVATED_ABANDONMENT');
    expect(profile.flags).toContain('HIGH_SUPPORT_DEMAND');
    expect(profile.flags).toContain('REPEATED_CONCEPTUAL_ERRORS');
    expect(profile.flags).toContain('HIGH_STRUGGLE_RATE');
    expect(profile.confidence).toBeGreaterThanOrEqual(0.6);
  });
});
