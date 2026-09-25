import { Test, TestingModule } from '@nestjs/testing';
import { CandidateService } from '../candidate/candidate.service';
import { CandidateDeduplicator } from '../candidate/candidate.deduplicator';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveActionType,
  AdaptiveReasonCode,
  CandidateSource,
} from '../decision/decision.types';

describe('CandidateService & Deduplicator (LKC-7)', () => {
  let service: CandidateService;
  let deduplicator: CandidateDeduplicator;
  let mockPrisma: any;

  beforeEach(async () => {
    deduplicator = new CandidateDeduplicator();

    mockPrisma = {
      teacherAdaptiveOverride: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      contentAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      adaptiveSession: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      learnerKnowledgeState: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      knowledgeRelationship: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateService,
        { provide: CandidateDeduplicator, useValue: deduplicator },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CandidateService>(CandidateService);
  });

  describe('CandidateDeduplicator', () => {
    it('should merge duplicate candidates by knowledgeId + action, preserving highest priority', () => {
      const candidates = [
        {
          knowledgeId: 'k-1',
          action: AdaptiveActionType.PRACTICE,
          source: CandidateSource.CURRICULUM,
          required: false,
          priority: 50,
          confidence: 0.7,
          reasonCodes: [AdaptiveReasonCode.CURRICULUM_SEQUENCE],
        },
        {
          knowledgeId: 'k-1',
          action: AdaptiveActionType.PRACTICE,
          source: CandidateSource.ASSIGNMENT,
          required: true,
          priority: 90,
          confidence: 0.95,
          reasonCodes: [AdaptiveReasonCode.ASSIGNMENT_REQUIRED],
        },
      ];

      const deduplicated = deduplicator.deduplicate(candidates);
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].priority).toBe(90);
      expect(deduplicated[0].required).toBe(true);
      expect(deduplicated[0].reasonCodes).toContain(AdaptiveReasonCode.CURRICULUM_SEQUENCE);
      expect(deduplicated[0].reasonCodes).toContain(AdaptiveReasonCode.ASSIGNMENT_REQUIRED);
    });
  });

  describe('CandidateService', () => {
    it('should generate candidate from active teacher override with priority 100', async () => {
      mockPrisma.teacherAdaptiveOverride.findFirst.mockResolvedValue({
        id: 'ov-1',
        action: 'FORCE_ADVANCE',
        targetKnowledgeId: 'k-advanced',
        reason: 'Teacher approved acceleration',
      });

      const candidates = await service.generateCandidates('learner-1', 'k-current', 'tenant-1');
      expect(candidates.length).toBeGreaterThan(0);
      const overrideCand = candidates.find((c) => c.source === CandidateSource.TEACHER_PATH);
      expect(overrideCand).toBeDefined();
      expect(overrideCand?.action).toBe(AdaptiveActionType.ADVANCE);
      expect(overrideCand?.priority).toBe(100);
      expect(overrideCand?.required).toBe(true);
    });

    it('should generate candidate from active required assignment with priority 90', async () => {
      mockPrisma.contentAssignment.findMany.mockResolvedValue([
        {
          id: 'asg-1',
          contentId: 'k-assigned',
          dueDate: new Date(),
        },
      ]);

      const candidates = await service.generateCandidates('learner-1', undefined, 'tenant-1');
      const asgCand = candidates.find((c) => c.source === CandidateSource.ASSIGNMENT);
      expect(asgCand).toBeDefined();
      expect(asgCand?.knowledgeId).toBe('k-assigned');
      expect(asgCand?.priority).toBe(90);
      expect(asgCand?.required).toBe(true);
    });

    it('should generate review candidate when spaced review is due', async () => {
      mockPrisma.learnerKnowledgeState.findMany.mockResolvedValue([
        {
          knowledgeObjectId: 'k-old-concept',
          masteryLevel: 0.85,
          lastPracticedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
      ]);

      const candidates = await service.generateCandidates('learner-1', undefined, 'tenant-1');
      const revCand = candidates.find((c) => c.action === AdaptiveActionType.REVIEW);
      expect(revCand).toBeDefined();
      expect(revCand?.reasonCodes).toContain(AdaptiveReasonCode.REVIEW_DUE);
    });
  });
});
