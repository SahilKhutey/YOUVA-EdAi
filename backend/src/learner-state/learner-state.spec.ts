import { NotFoundException } from '@nestjs/common';
import { LearnerStateService } from './learner-state.service';

describe('LearnerStateService (Unified Learner State)', () => {
  let service: LearnerStateService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-101',
          name: 'Aarav Sharma',
          cognitiveLevel: 'TEEN',
          gradeLevel: '10',
          stats: { streakDays: 7 },
          cognitiveProfile: {
            workingMemory: 0.8,
            processingSpeed: 0.75,
            fatigueIndex: 0.2,
            focusIndex: 0.85,
            inferredState: 'flow',
            updatedAt: new Date(),
          },
        }),
      },
      userTopicMastery: {
        findMany: jest.fn().mockResolvedValue([
          {
            topicId: 'topic-algebra-1',
            mastery: 0.8,
            certifiedMastery: true,
            certifiedAt: new Date(),
            updatedAt: new Date(),
            topic: { title: 'Linear Equations', subject: { name: 'Mathematics' } },
          },
          {
            topicId: 'topic-quadratics-2',
            mastery: 0.4,
            certifiedMastery: false,
            updatedAt: new Date(),
            topic: { title: 'Quadratic Functions', subject: { name: 'Mathematics' } },
          },
        ]),
      },
      safetyEscalation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      consentRecord: {
        findMany: jest.fn().mockResolvedValue([
          { consentType: 'AI_CURRICULUM_PERSONALIZATION', status: 'GRANTED' },
        ]),
      },
      teacherIntervention: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      studyGoal: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'goal-1', title: 'Master Algebra', targetScore: 0.9, currentScore: 0.6 },
        ]),
      },
    };

    service = new LearnerStateService(mockPrisma);
  });

  describe('getUnifiedLearnerSnapshot', () => {
    it('should aggregate mastery, cognitive twin, safety, and goals into a unified dossier', async () => {
      const snapshot = await service.getUnifiedLearnerSnapshot('student-101', 'tenant-apex');

      expect(snapshot.studentId).toBe('student-101');
      expect(snapshot.tenantId).toBe('tenant-apex');
      expect(snapshot.overallAverageMastery).toBe(0.6); // (0.8 + 0.4) / 2
      expect(snapshot.masteryVector['topic-algebra-1'].certifiedByTeacher).toBe(true);
      expect(snapshot.cognitiveProfile.inferredState).toBe('flow');
      expect(snapshot.safetyAndConsent.activeEscalationSeverity).toBe('NONE');
      expect(snapshot.safetyAndConsent.hasActiveTeacherIntervention).toBe(false);
      expect(snapshot.activeGoals.length).toBe(1);
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUnifiedLearnerSnapshot('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evaluateReadiness & Invariants', () => {
    it('should enforce TEACHER OVERRIDE as strictly authoritative over AI logic', async () => {
      // Setup active teacher override for quadratics
      mockPrisma.teacherIntervention.findMany.mockResolvedValue([
        {
          id: 'int-77',
          teacherId: 'teacher-smith',
          studentId: 'student-101',
          action: 'OVERRIDE',
          overrideDetails: JSON.stringify({
            topicId: 'topic-quadratics-2',
            difficulty: 0.25, // Teacher mandated lowering difficulty
            modality: 'VISUAL',
            notes: 'Aarav is struggling with factoring; reinforce with geometric models.',
          }),
          feedback: 'Reinforce foundational visual factoring',
          createdAt: new Date(),
        },
      ]);

      const readiness = await service.evaluateReadiness('student-101', 'topic-quadratics-2');

      expect(readiness.ready).toBe(true);
      expect(readiness.isTeacherOverridden).toBe(true);
      expect(readiness.effectiveDifficulty).toBe(0.25);
      expect(readiness.mandatedModality).toBe('VISUAL');
      expect(readiness.reason).toContain('Teacher override enforced');
    });

    it('should halt automated progression when active safety escalation is HIGH or CRITICAL', async () => {
      mockPrisma.safetyEscalation.findMany.mockResolvedValue([
        {
          id: 'esc-999',
          studentId: 'student-101',
          severity: 'HIGH',
          status: 'OPEN',
          category: 'DISTRESS',
        },
      ]);

      const readiness = await service.evaluateReadiness('student-101', 'topic-algebra-1');

      expect(readiness.ready).toBe(false);
      expect(readiness.safetyHalted).toBe(true);
      expect(readiness.reason).toContain('Active safety escalation [HIGH]');
    });

    it('should recommend a pause when cognitive fatigue index exceeds 0.75', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'student-101',
        cognitiveLevel: 'TEEN',
        cognitiveProfile: {
          fatigueIndex: 0.88, // High fatigue
          workingMemory: 0.4,
          inferredState: 'fatigue',
        },
      });

      const readiness = await service.evaluateReadiness('student-101', 'topic-algebra-1');

      expect(readiness.ready).toBe(false);
      expect(readiness.reason).toContain('Cognitive fatigue threshold exceeded');
    });

    it('should calibrate standard proximal development when no blockers or overrides exist', async () => {
      const readiness = await service.evaluateReadiness('student-101', 'topic-algebra-1');

      expect(readiness.ready).toBe(true);
      expect(readiness.isTeacherOverridden).toBe(false);
      expect(readiness.effectiveDifficulty).toBe(0.9); // 0.8 mastery + 0.1 delta
    });
  });
});
