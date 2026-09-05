import { Test, TestingModule } from '@nestjs/testing';
import { PolicyEngineService } from './policy-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GateState, EscalationSeverity } from '../domain/enums';
import { StudentLearningContext } from '../domain/types';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      escalationEvent: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PolicyEngineService>(PolicyEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Invariant: AI cannot certify mastery', () => {
    it('should always return false when AI proposes certified mastery', () => {
      expect(service.enforceMasteryCertificationRule(true)).toBe(false);
      expect(service.enforceMasteryCertificationRule(false)).toBe(false);
    });
  });

  describe('evaluateGate', () => {
    const baseContext: StudentLearningContext = {
      userId: 'student-1',
      topicId: 'topic-1',
      cognitiveLevel: 'TEEN',
      gradeLevel: '10',
      currentMastery: 0.5,
      currentDifficulty: 0.5,
      cognitiveLoad: 0.3,
      errorClusterScore: 0.2,
      inferredState: 'flow',
      recentMistakes: [],
      activeGoals: [],
    };

    it('should lock gate to SAFETY_ESCALATION if an unresolved safety escalation exists', async () => {
      prisma.escalationEvent.findFirst.mockResolvedValue({
        id: 'esc-1',
        userId: 'student-1',
        severity: EscalationSeverity.HIGH,
        reason: 'Severe distress detected in conversational input.',
        status: 'OPEN',
      });

      const result = await service.evaluateGate('student-1', 'topic-1', baseContext);

      expect(result.gateState).toBe(GateState.SAFETY_ESCALATION);
      expect(result.requiresSafetyEscalation).toBe(true);
      expect(result.requiresTeacherReview).toBe(true);
    });

    it('should route to TEACHER_REVIEW_REQUIRED when cognitive load exceeds 0.85', async () => {
      prisma.escalationEvent.findFirst.mockResolvedValue(null);

      const highLoadContext: StudentLearningContext = {
        ...baseContext,
        cognitiveLoad: 0.92,
      };

      const result = await service.evaluateGate('student-1', 'topic-1', highLoadContext);

      expect(result.gateState).toBe(GateState.TEACHER_REVIEW_REQUIRED);
      expect(result.requiresTeacherReview).toBe(true);
      expect(result.requiresSafetyEscalation).toBe(false);
      expect(result.reason).toContain('cognitive load exceeds maximum threshold');
    });

    it('should route to TEACHER_REVIEW_REQUIRED when error clustering is high and consecutive mistakes occur', async () => {
      prisma.escalationEvent.findFirst.mockResolvedValue(null);

      const errorClusterContext: StudentLearningContext = {
        ...baseContext,
        cognitiveLoad: 0.4,
        errorClusterScore: 0.82,
        recentMistakes: ['Mistake A', 'Mistake B', 'Mistake C'],
      };

      const result = await service.evaluateGate('student-1', 'topic-1', errorClusterContext);

      expect(result.gateState).toBe(GateState.TEACHER_REVIEW_REQUIRED);
      expect(result.requiresTeacherReview).toBe(true);
    });

    it('should allow AI_CONTINUE when metrics are nominal', async () => {
      prisma.escalationEvent.findFirst.mockResolvedValue(null);

      const result = await service.evaluateGate('student-1', 'topic-1', baseContext);

      expect(result.gateState).toBe(GateState.AI_CONTINUE);
      expect(result.requiresTeacherReview).toBe(false);
      expect(result.requiresSafetyEscalation).toBe(false);
    });
  });
});
