import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizationEngineService } from './personalization-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { PolicyEngineService } from '../policy/policy-engine.service';
import { ActivityType, Modality, Pacing } from '../domain/enums';
import { StudentLearningContext } from '../domain/types';

describe('PersonalizationEngineService', () => {
  let service: PersonalizationEngineService;
  let prisma: any;
  let auditService: any;
  let policyEngine: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      topic: { findUnique: jest.fn() },
      userTopicMastery: { findUnique: jest.fn() },
      cognitiveStateLog: { findFirst: jest.fn() },
      mistakeLog: { findMany: jest.fn() },
      studyGoal: { findMany: jest.fn() },
      personalizationDecision: {
        create: jest.fn().mockImplementation((args) => ({ id: 'decision-123', ...args.data })),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    policyEngine = {
      enforceMasteryCertificationRule: jest.fn().mockReturnValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizationEngineService,
        { provide: PrismaService, useValue: prisma },
        { provide: LearningLoopAuditService, useValue: auditService },
        { provide: PolicyEngineService, useValue: policyEngine },
      ],
    }).compile();

    service = module.get<PersonalizationEngineService>(PersonalizationEngineService);
  });

  const baseContext: StudentLearningContext = {
    userId: 'student-1',
    topicId: 'topic-calc-01',
    cognitiveLevel: 'TEEN',
    gradeLevel: '11',
    currentMastery: 0.2,
    currentDifficulty: 0.4,
    cognitiveLoad: 0.3,
    errorClusterScore: 0.1,
    inferredState: 'flow',
    recentMistakes: [],
    activeGoals: [],
  };

  describe('Deterministic Recommendations', () => {
    it('should recommend EXPLANATION for low mastery (<0.35) without mistakes', async () => {
      const { recommendation } = await service.generateRecommendation(baseContext);

      expect(recommendation.activityType).toBe(ActivityType.EXPLANATION);
      expect(recommendation.isCertifiedMastery).toBe(false);
    });

    it('should recommend REMEDIATION when student has active mistakes and low mastery', async () => {
      const contextWithMistakes: StudentLearningContext = {
        ...baseContext,
        recentMistakes: ['Sign error in quadratic formula'],
      };

      const { recommendation } = await service.generateRecommendation(contextWithMistakes);

      expect(recommendation.activityType).toBe(ActivityType.REMEDIATION);
    });

    it('should recommend PRACTICE for intermediate mastery (0.35 - 0.70)', async () => {
      const intermediateContext: StudentLearningContext = {
        ...baseContext,
        currentMastery: 0.55,
      };

      const { recommendation } = await service.generateRecommendation(intermediateContext);

      expect(recommendation.activityType).toBe(ActivityType.PRACTICE);
    });

    it('should recommend CHALLENGE for high mastery (>= 0.85)', async () => {
      const highMasteryContext: StudentLearningContext = {
        ...baseContext,
        currentMastery: 0.90,
      };

      const { recommendation } = await service.generateRecommendation(highMasteryContext);

      expect(recommendation.activityType).toBe(ActivityType.CHALLENGE);
    });

    it('should shift modality to VISUAL and pacing to SLOW under high cognitive load', async () => {
      const strainedContext: StudentLearningContext = {
        ...baseContext,
        cognitiveLoad: 0.75,
      };

      const { recommendation } = await service.generateRecommendation(strainedContext);

      expect(recommendation.modality).toBe(Modality.VISUAL);
      expect(recommendation.pacing).toBe(Pacing.SLOW);
    });

    it('should STRICTLY enforce that AI cannot certify mastery', async () => {
      const highMasteryContext: StudentLearningContext = {
        ...baseContext,
        currentMastery: 0.99,
      };

      const { recommendation } = await service.generateRecommendation(highMasteryContext);

      expect(recommendation.isCertifiedMastery).toBe(false);
      expect(prisma.personalizationDecision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isCertifiedMastery: false,
          }),
        }),
      );
    });
  });
});
