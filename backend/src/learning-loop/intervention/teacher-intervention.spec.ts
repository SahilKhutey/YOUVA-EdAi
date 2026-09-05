import { Test, TestingModule } from '@nestjs/testing';
import { TeacherInterventionService } from './teacher-intervention.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { InterventionAction, ActivityType, DecisionStatus, ActorType } from '../domain/enums';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TeacherInterventionService', () => {
  let service: TeacherInterventionService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      digitalClassroomSession: { findFirst: jest.fn(), findMany: jest.fn() },
      worksheetSubmission: { findFirst: jest.fn(), findMany: jest.fn() },
      personalizationDecision: { findUnique: jest.fn(), update: jest.fn() },
      teacherIntervention: { create: jest.fn() },
      policyGateDecision: { findMany: jest.fn() },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherInterventionService,
        { provide: PrismaService, useValue: prisma },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TeacherInterventionService>(TeacherInterventionService);
  });

  describe('Teacher Scope Security', () => {
    it('should throw ForbiddenException if teacher is not linked to student by classroom or worksheet', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      prisma.digitalClassroomSession.findFirst.mockResolvedValue(null);
      prisma.worksheetSubmission.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyTeacherStudentScope('teacher-1', 'unassigned-student'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should pass scope check if teacher has active digital classroom session with student', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      prisma.digitalClassroomSession.findFirst.mockResolvedValue({ id: 'sess-1' });

      await expect(
        service.verifyTeacherStudentScope('teacher-1', 'assigned-student'),
      ).resolves.not.toThrow();
    });

    it('should allow ADMIN role to bypass student scoping check', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

      await expect(
        service.verifyTeacherStudentScope('admin-1', 'any-student'),
      ).resolves.not.toThrow();
    });
  });

  describe('Teacher Override Authority', () => {
    it('should override AI recommendation and mark decision as OVERRIDDEN', async () => {
      // Setup teacher and assigned student
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      prisma.digitalClassroomSession.findFirst.mockResolvedValue({ id: 'sess-1' });

      prisma.personalizationDecision.findUnique.mockResolvedValue({
        id: 'decision-ai-1',
        activityType: ActivityType.PRACTICE,
        difficulty: 0.6,
        status: DecisionStatus.PROPOSED,
      });

      prisma.personalizationDecision.update.mockResolvedValue({
        id: 'decision-ai-1',
        status: DecisionStatus.OVERRIDDEN,
      });

      prisma.teacherIntervention.create.mockResolvedValue({
        id: 'intervention-1',
        action: InterventionAction.OVERRIDE,
        status: 'RESOLVED',
      });

      const result = await service.executeIntervention('teacher-1', {
        studentId: 'student-1',
        decisionId: 'decision-ai-1',
        action: InterventionAction.OVERRIDE,
        overrideDetails: {
          forcedActivityType: ActivityType.REMEDIATION,
          forcedDifficulty: 0.3,
          teacherNotes: 'Student needs concept reinforcement before proceeding.',
        },
      });

      expect(prisma.personalizationDecision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'decision-ai-1' },
          data: expect.objectContaining({
            status: DecisionStatus.OVERRIDDEN,
            activityType: ActivityType.REMEDIATION,
            difficulty: 0.3,
          }),
        }),
      );

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: ActorType.TEACHER,
          action: 'TEACHER_OVERRIDE',
        }),
      );

      expect(result.id).toBe('intervention-1');
    });

    it('should mark decision as ACCEPTED when teacher approves AI recommendation', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
      prisma.digitalClassroomSession.findFirst.mockResolvedValue({ id: 'sess-1' });

      prisma.personalizationDecision.findUnique.mockResolvedValue({
        id: 'decision-ai-1',
        status: DecisionStatus.PROPOSED,
      });

      prisma.teacherIntervention.create.mockResolvedValue({
        id: 'intervention-2',
        action: InterventionAction.APPROVE,
        status: 'RESOLVED',
      });

      await service.executeIntervention('teacher-1', {
        studentId: 'student-1',
        decisionId: 'decision-ai-1',
        action: InterventionAction.APPROVE,
      });

      expect(prisma.personalizationDecision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'decision-ai-1' },
          data: { status: DecisionStatus.ACCEPTED },
        }),
      );
    });
  });
});
