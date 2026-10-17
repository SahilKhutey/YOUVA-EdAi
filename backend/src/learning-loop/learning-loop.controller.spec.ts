import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LearningLoopController } from './learning-loop.controller';
import { LearningLoopService } from './learning-loop.service';
import { TeacherInterventionService } from './intervention/teacher-intervention.service';
import { EscalationStateMachineService } from './escalation/escalation-state-machine.service';
import { LearningLoopAuditService } from './audit/learning-loop-audit.service';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '../auth/role.enum';
import { InterventionAction, ActivityType } from './domain/enums';

let scopeAuth: any;

describe('LearningLoopController', () => {
  let controller: LearningLoopController;
  let learningLoopService: any;
  let teacherInterventionService: any;
  let escalationStateMachine: any;
  let auditService: any;

  beforeEach(async () => {
    learningLoopService = {
      getContext: jest.fn().mockResolvedValue({ userId: 'student-1' }),
      personalize: jest.fn().mockResolvedValue({ isAllowed: true }),
      processEvidenceAndAdvance: jest.fn().mockResolvedValue({ statusMessage: 'OK' }),
      getGateStatus: jest.fn().mockResolvedValue({ gateState: 'AI_CONTINUE' }),
    };

    teacherInterventionService = {
      getTeacherQueue: jest.fn().mockResolvedValue([]),
      executeIntervention: jest.fn().mockResolvedValue({ id: 'int-1' }),
    };

    escalationStateMachine = {
      transitionState: jest.fn().mockResolvedValue({ status: 'RESOLVED' }),
    };

    auditService = {
      getStudentAuditTrail: jest.fn().mockResolvedValue([]),
    };

    scopeAuth = { assertTeacherStudentScope: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningLoopController],
      providers: [
        { provide: LearningLoopService, useValue: learningLoopService },
        { provide: TeacherInterventionService, useValue: teacherInterventionService },
        { provide: EscalationStateMachineService, useValue: escalationStateMachine },
        { provide: LearningLoopAuditService, useValue: auditService },
        { provide: ScopeAuthorizationService, useValue: scopeAuth },
      ],
    }).compile();

    controller = module.get<LearningLoopController>(LearningLoopController);
  });

  describe('Authorization & Scoping Tests', () => {
    it('lets a teacher read an audit trail only for a student in their scope', async () => {
      const teacherReq = { user: { id: 'teacher-1', role: Role.TEACHER } };
      await controller.getAuditTrail(teacherReq, 'student-1');
      expect(scopeAuth.assertTeacherStudentScope).toHaveBeenCalledWith('teacher-1', 'student-1');
      scopeAuth.assertTeacherStudentScope.mockRejectedValueOnce(new ForbiddenException());
      await expect(controller.getAuditTrail(teacherReq, 'student-other')).rejects.toThrow(ForbiddenException);
    });

    it('should reject a student attempting to view another students gate status', async () => {
      const studentReq = {
        user: { id: 'student-1', role: Role.STUDENT },
      };

      await expect(
        controller.getGateStatus(studentReq, 'student-other'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow a student to view their own gate status', async () => {
      const studentReq = {
        user: { id: 'student-1', role: Role.STUDENT },
      };

      const res = await controller.getGateStatus(studentReq, 'student-1');
      expect(res).toBeDefined();
      expect(learningLoopService.getGateStatus).toHaveBeenCalledWith('student-1', 'default-topic');
    });

    it('should reject a student attempting to view another students audit trail', async () => {
      const studentReq = {
        user: { id: 'student-1', role: Role.STUDENT },
      };

      await expect(
        controller.getAuditTrail(studentReq, 'student-other'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow a teacher to view any students audit trail within their scope', async () => {
      const teacherReq = {
        user: { id: 'teacher-1', role: Role.TEACHER },
      };

      const res = await controller.getAuditTrail(teacherReq, 'student-1');
      expect(res).toBeDefined();
      expect(auditService.getStudentAuditTrail).toHaveBeenCalledWith('student-1');
    });
  });

  describe('Teacher Intervention Execution', () => {
    it('should delegate teacher intervention to TeacherInterventionService', async () => {
      const teacherReq = {
        user: { id: 'teacher-1', role: Role.TEACHER },
      };

      const dto = {
        studentId: 'student-1',
        action: InterventionAction.OVERRIDE,
        overrideDetails: { forcedActivityType: ActivityType.EXPLANATION },
      };

      await controller.executeTeacherIntervention(teacherReq, dto);

      expect(teacherInterventionService.executeIntervention).toHaveBeenCalledWith('teacher-1', dto);
    });
  });
});
