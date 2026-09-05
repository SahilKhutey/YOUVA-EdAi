import { Test, TestingModule } from '@nestjs/testing';
import { TeacherRecommendationService } from './services/teacher-recommendation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { LearningLoopAuditService } from '../learning-loop/audit/learning-loop-audit.service';
import { ActivityType, DecisionStatus } from '../learning-loop/domain/enums';
import { BadRequestException } from '@nestjs/common';

describe('P2 Teacher Recommendation & Authoritative Override System', () => {
  let service: TeacherRecommendationService;
  let prisma: any;
  let scopeAuth: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      personalizationDecision: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      teacherIntervention: {
        create: jest.fn(),
      },
    };

    scopeAuth = {
      getScopedStudentIds: jest.fn().mockResolvedValue(['student-1', 'student-2']),
      assertTeacherStudentScope: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherRecommendationService,
        { provide: PrismaService, useValue: prisma },
        { provide: ScopeAuthorizationService, useValue: scopeAuth },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TeacherRecommendationService>(TeacherRecommendationService);
  });

  describe('Recommendations Operations', () => {
    it('✓ teacher can view recommendations for scoped students', async () => {
      prisma.personalizationDecision.findMany.mockResolvedValue([
        { id: 'dec-1', userId: 'student-1', activityType: 'PRACTICE' },
      ]);

      const result = await service.getRecommendations('teacher-1');

      expect(result).toHaveLength(1);
      expect(prisma.personalizationDecision.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: { in: ['student-1', 'student-2'] } },
        }),
      );
    });

    it('✓ teacher can approve recommendation and update status to ACCEPTED', async () => {
      prisma.personalizationDecision.findUnique.mockResolvedValue({
        id: 'dec-1',
        userId: 'student-1',
        status: DecisionStatus.PROPOSED,
      });

      prisma.personalizationDecision.update.mockResolvedValue({
        id: 'dec-1',
        status: DecisionStatus.ACCEPTED,
      });

      const res = await service.approveRecommendation('teacher-1', 'dec-1');

      expect(res.status).toBe(DecisionStatus.ACCEPTED);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_RECOMMENDATION_APPROVED',
        }),
      );
    });

    it('✓ teacher can override recommendation with forced difficulty and activity', async () => {
      prisma.personalizationDecision.findUnique.mockResolvedValue({
        id: 'dec-2',
        userId: 'student-1',
        activityType: 'PRACTICE',
        difficulty: 0.7,
        status: DecisionStatus.PROPOSED,
      });

      prisma.personalizationDecision.update.mockResolvedValue({
        id: 'dec-2',
        status: DecisionStatus.OVERRIDDEN,
        activityType: ActivityType.REMEDIATION,
        difficulty: 0.35,
      });

      const res = await service.overrideRecommendation('teacher-1', 'dec-2', {
        reason: 'Student requires fundamental remediation before progressing.',
        forcedActivityType: ActivityType.REMEDIATION,
        forcedDifficulty: 0.35,
      });

      expect(res.status).toBe(DecisionStatus.OVERRIDDEN);
      expect(prisma.teacherIntervention.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_RECOMMENDATION_OVERRIDDEN',
        }),
      );
    });

    it('✓ teacher cannot override already finalized recommendation', async () => {
      prisma.personalizationDecision.findUnique.mockResolvedValue({
        id: 'dec-final',
        userId: 'student-1',
        status: DecisionStatus.OVERRIDDEN,
      });

      await expect(
        service.overrideRecommendation('teacher-1', 'dec-final', {
          reason: 'Attempting secondary override',
          forcedActivityType: ActivityType.CHALLENGE,
          forcedDifficulty: 0.9,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
