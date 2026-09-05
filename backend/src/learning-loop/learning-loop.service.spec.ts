import { Test, TestingModule } from '@nestjs/testing';
import { LearningLoopService } from './learning-loop.service';
import { PrismaService } from '../prisma/prisma.service';
import { PolicyEngineService } from './policy/policy-engine.service';
import { EvidenceProcessorService } from './evidence/evidence-processor.service';
import { PersonalizationEngineService } from './personalization/personalization-engine.service';
import { EscalationStateMachineService } from './escalation/escalation-state-machine.service';
import { TeacherInterventionService } from './intervention/teacher-intervention.service';
import { LearningLoopAuditService } from './audit/learning-loop-audit.service';
import { GateState, ActivityType, Modality, Pacing } from './domain/enums';

describe('LearningLoopService (End-to-End Loop Orchestrator)', () => {
  let service: LearningLoopService;
  let prisma: any;
  let policyEngine: any;
  let evidenceProcessor: any;
  let personalizationEngine: any;
  let escalationStateMachine: any;
  let teacherIntervention: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      policyGateDecision: { create: jest.fn() },
      digitalClassroomSession: { findFirst: jest.fn() },
      teacherIntervention: { create: jest.fn() },
    };

    policyEngine = {
      evaluateGate: jest.fn(),
    };

    evidenceProcessor = {
      processEvidence: jest.fn(),
    };

    personalizationEngine = {
      buildStudentContext: jest.fn().mockResolvedValue({
        userId: 'student-1',
        topicId: 'topic-1',
        cognitiveLoad: 0.2,
      }),
      generateRecommendation: jest.fn().mockResolvedValue({
        decisionId: 'dec-1',
        recommendation: {
          activityType: ActivityType.PRACTICE,
          difficulty: 0.5,
          modality: Modality.INTERACTIVE,
          pacing: Pacing.STANDARD,
          isCertifiedMastery: false,
        },
      }),
    };

    escalationStateMachine = {
      triggerEscalation: jest.fn(),
    };

    teacherIntervention = {
      executeIntervention: jest.fn(),
    };

    auditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningLoopService,
        { provide: PrismaService, useValue: prisma },
        { provide: PolicyEngineService, useValue: policyEngine },
        { provide: EvidenceProcessorService, useValue: evidenceProcessor },
        { provide: PersonalizationEngineService, useValue: personalizationEngine },
        { provide: EscalationStateMachineService, useValue: escalationStateMachine },
        { provide: TeacherInterventionService, useValue: teacherIntervention },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LearningLoopService>(LearningLoopService);
  });

  describe('Full Loop Execution Flow', () => {
    it('should complete evidence -> mastery -> AI_CONTINUE -> next action flow', async () => {
      evidenceProcessor.processEvidence.mockResolvedValue({
        isIdempotentReplay: false,
        evidenceId: 'ev-1',
        masteryProbability: 0.65,
        targetDifficulty: 0.5,
        isCorrect: true,
      });

      policyEngine.evaluateGate.mockResolvedValue({
        gateState: GateState.AI_CONTINUE,
        reason: 'Safe to proceed.',
        ruleEvaluations: [],
        requiresTeacherReview: false,
        requiresSafetyEscalation: false,
      });

      const result = await service.processEvidenceAndAdvance('student-1', {
        idempotencyKey: 'idemp-key-1',
        topicId: 'topic-1',
        answer: 'Correct answer',
        accuracy: 1.0,
      });

      expect(result.evidence.isIdempotentReplay).toBe(false);
      expect(result.gate.gateState).toBe(GateState.AI_CONTINUE);
      expect(result.nextAction).toBeDefined();
      expect(result.nextAction?.activityType).toBe(ActivityType.PRACTICE);
      expect(result.nextAction?.isCertifiedMastery).toBe(false);
      expect(prisma.policyGateDecision.create).toHaveBeenCalled();
    });

    it('should pause session and alert teacher when gate evaluates to TEACHER_REVIEW_REQUIRED', async () => {
      evidenceProcessor.processEvidence.mockResolvedValue({
        isIdempotentReplay: false,
        evidenceId: 'ev-2',
        masteryProbability: 0.2,
        targetDifficulty: 0.3,
        isCorrect: false,
      });

      policyEngine.evaluateGate.mockResolvedValue({
        gateState: GateState.TEACHER_REVIEW_REQUIRED,
        reason: 'High cognitive load detected.',
        ruleEvaluations: [],
        requiresTeacherReview: true,
        requiresSafetyEscalation: false,
      });

      prisma.digitalClassroomSession.findFirst.mockResolvedValue({
        teacherId: 'teacher-assigned-1',
      });

      const result = await service.processEvidenceAndAdvance('student-1', {
        idempotencyKey: 'idemp-key-2',
        topicId: 'topic-1',
        answer: 'Incorrect answer',
        accuracy: 0.0,
      });

      expect(result.gate.gateState).toBe(GateState.TEACHER_REVIEW_REQUIRED);
      expect(result.nextAction).toBeNull();
      expect(result.statusMessage).toContain('Teacher review required');
      expect(prisma.teacherIntervention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teacherId: 'teacher-assigned-1',
            studentId: 'student-1',
            action: 'INTERVENE',
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_REVIEW_TRIGGERED',
        }),
      );
    });
  });
});
