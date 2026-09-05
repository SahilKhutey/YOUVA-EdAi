import { Test, TestingModule } from '@nestjs/testing';
import { TeacherInterventionOpsService } from './services/teacher-intervention-ops.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { LearningLoopAuditService } from '../learning-loop/audit/learning-loop-audit.service';
import { InterventionStatus, ActorType } from '../learning-loop/domain/enums';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('P2 Teacher Intervention Operations & Queue System', () => {
  let service: TeacherInterventionOpsService;
  let prisma: any;
  let scopeAuth: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      teacherIntervention: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    scopeAuth = {
      getScopedStudentIds: jest.fn().mockResolvedValue(['student-1']),
      assertTeacherStudentScope: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherInterventionOpsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ScopeAuthorizationService, useValue: scopeAuth },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TeacherInterventionOpsService>(TeacherInterventionOpsService);
  });

  describe('Intervention Queue Prioritization', () => {
    it('✓ separates interventions into URGENT and REVIEW tiers based on cognitive/escalation signals', async () => {
      prisma.teacherIntervention.findMany.mockResolvedValue([
        {
          id: 'int-urgent',
          studentId: 'student-1',
          status: InterventionStatus.PENDING,
          action: 'INTERVENE',
          student: {
            id: 'student-1',
            email: 'urgent@test.com',
            escalationEvents: [{ id: 'esc-1', severity: 'CRITICAL', reason: 'High distress' }],
            cognitiveStateLogs: [{ cognitiveLoad: 0.9 }],
          },
        },
        {
          id: 'int-review',
          studentId: 'student-2',
          status: InterventionStatus.PENDING,
          action: 'REVIEW',
          student: {
            id: 'student-2',
            email: 'review@test.com',
            escalationEvents: [],
            cognitiveStateLogs: [{ cognitiveLoad: 0.5 }],
          },
        },
      ]);

      const queue = await service.getInterventionQueue('teacher-1');

      expect(queue.urgent).toHaveLength(1);
      expect(queue.urgent[0].id).toBe('int-urgent');
      expect(queue.review).toHaveLength(1);
      expect(queue.review[0].id).toBe('int-review');
    });
  });

  describe('Intervention Resolution Boundaries', () => {
    it('✓ AI cannot resolve teacher interventions (throws ForbiddenException)', async () => {
      await expect(
        service.resolveIntervention(
          'teacher-1',
          'int-1',
          { resolutionNotes: 'Auto-dismissed by AI' },
          ActorType.AI,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('✓ teacher can resolve intervention with mandatory notes and audit event is created', async () => {
      prisma.teacherIntervention.findUnique.mockResolvedValue({
        id: 'int-1',
        studentId: 'student-1',
        status: InterventionStatus.PENDING,
        feedback: 'Initial note',
      });

      prisma.teacherIntervention.update.mockResolvedValue({
        id: 'int-1',
        status: InterventionStatus.RESOLVED,
      });

      const res = await service.resolveIntervention('teacher-1', 'int-1', {
        resolutionNotes: 'Conducted 1-on-1 tutoring session and clarified quadratic formula.',
      });

      expect(res.status).toBe(InterventionStatus.RESOLVED);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_INTERVENTION_RESOLVED',
          actorType: ActorType.TEACHER,
        }),
      );
    });

    it('✓ resolved intervention cannot be resolved twice', async () => {
      prisma.teacherIntervention.findUnique.mockResolvedValue({
        id: 'int-resolved',
        studentId: 'student-1',
        status: InterventionStatus.RESOLVED,
      });

      await expect(
        service.resolveIntervention('teacher-1', 'int-resolved', {
          resolutionNotes: 'Second attempt to resolve',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
