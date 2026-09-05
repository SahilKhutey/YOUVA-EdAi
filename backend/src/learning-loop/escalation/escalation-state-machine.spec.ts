import { Test, TestingModule } from '@nestjs/testing';
import { EscalationStateMachineService } from './escalation-state-machine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { EscalationStatus, EscalationSeverity, ActorType } from '../domain/enums';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('EscalationStateMachineService', () => {
  let service: EscalationStateMachineService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      escalationEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationStateMachineService,
        { provide: PrismaService, useValue: prisma },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EscalationStateMachineService>(EscalationStateMachineService);
  });

  describe('Policy: Safety escalation cannot be silently dismissed by AI', () => {
    it('should reject resolution attempts when actor is AI', async () => {
      await expect(
        service.transitionState(
          'esc-1',
          EscalationStatus.RESOLVED,
          ActorType.AI,
          'GEMINI_AGENT',
          'Dismissing automatically',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.escalationEvent.update).not.toHaveBeenCalled();
    });

    it('should reject modification attempts when actor is STUDENT', async () => {
      await expect(
        service.transitionState(
          'esc-1',
          EscalationStatus.RESOLVED,
          ActorType.STUDENT,
          'student-1',
          'Self-resolving',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('State Transition Validation', () => {
    it('should throw NotFoundException if escalation does not exist', async () => {
      prisma.escalationEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionState(
          'esc-missing',
          EscalationStatus.IN_REVIEW,
          ActorType.TEACHER,
          'teacher-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject reopening a RESOLVED escalation', async () => {
      prisma.escalationEvent.findUnique.mockResolvedValue({
        id: 'esc-1',
        status: EscalationStatus.RESOLVED,
        severity: EscalationSeverity.HIGH,
      });

      await expect(
        service.transitionState(
          'esc-1',
          EscalationStatus.OPEN,
          ActorType.TEACHER,
          'teacher-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transition from OPEN directly to RESOLVED for CRITICAL severity without IN_REVIEW', async () => {
      prisma.escalationEvent.findUnique.mockResolvedValue({
        id: 'esc-crit',
        status: EscalationStatus.OPEN,
        severity: EscalationSeverity.CRITICAL,
      });

      await expect(
        service.transitionState(
          'esc-crit',
          EscalationStatus.RESOLVED,
          ActorType.TEACHER,
          'teacher-1',
          'Notes',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require resolution notes when transitioning to RESOLVED', async () => {
      prisma.escalationEvent.findUnique.mockResolvedValue({
        id: 'esc-med',
        status: EscalationStatus.IN_REVIEW,
        severity: EscalationSeverity.MEDIUM,
      });

      await expect(
        service.transitionState(
          'esc-med',
          EscalationStatus.RESOLVED,
          ActorType.TEACHER,
          'teacher-1',
          '', // Empty notes
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition from IN_REVIEW to RESOLVED by TEACHER with notes', async () => {
      prisma.escalationEvent.findUnique.mockResolvedValue({
        id: 'esc-ok',
        userId: 'student-1',
        status: EscalationStatus.IN_REVIEW,
        severity: EscalationSeverity.HIGH,
      });

      prisma.escalationEvent.update.mockResolvedValue({
        id: 'esc-ok',
        status: EscalationStatus.RESOLVED,
        resolvedById: 'teacher-1',
        resolutionNotes: 'Reviewed student context and cleared intervention.',
      });

      const result = await service.transitionState(
        'esc-ok',
        EscalationStatus.RESOLVED,
        ActorType.TEACHER,
        'teacher-1',
        'Reviewed student context and cleared intervention.',
      );

      expect(result.status).toBe(EscalationStatus.RESOLVED);
      expect(prisma.escalationEvent.update).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ESCALATION_RESOLVED',
          actorType: ActorType.TEACHER,
        }),
      );
    });
  });
});
