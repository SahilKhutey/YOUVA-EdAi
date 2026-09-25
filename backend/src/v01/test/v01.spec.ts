import { Test, TestingModule } from '@nestjs/testing';
import { V01Service } from '../v01.service';
import { V01AdaptiveService } from '../v01-adaptive.service';
import { V01TaskLoggerService } from '../v01-task-logger.service';
import { V01Controller } from '../v01.controller';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { V01_LEARNING_ITEMS } from '../v01-content';

describe('YOUVA EdAI v0.1 — Minimum Learning Loop Test Suite (Step 10)', () => {
  let service: V01Service;
  let adaptiveService: V01AdaptiveService;
  let taskLogger: V01TaskLoggerService;
  let controller: V01Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V01Controller],
      providers: [V01Service, V01AdaptiveService, V01TaskLoggerService],
    }).compile();

    service = module.get<V01Service>(V01Service);
    adaptiveService = module.get<V01AdaptiveService>(V01AdaptiveService);
    taskLogger = module.get<V01TaskLoggerService>(V01TaskLoggerService);
    controller = module.get<V01Controller>(V01Controller);
  });

  // =========================================================================
  // 1. ADAPTIVE LOGIC TESTS
  // =========================================================================
  describe('1. Deterministic Adaptive Logic', () => {
    it('should transition correct EASY -> MEDIUM', () => {
      expect(adaptiveService.nextDifficulty('EASY', true)).toBe('MEDIUM');
    });

    it('should transition correct MEDIUM -> HARD', () => {
      expect(adaptiveService.nextDifficulty('MEDIUM', true)).toBe('HARD');
    });

    it('should transition correct HARD -> HARD', () => {
      expect(adaptiveService.nextDifficulty('HARD', true)).toBe('HARD');
    });

    it('should transition incorrect HARD -> MEDIUM', () => {
      expect(adaptiveService.nextDifficulty('HARD', false)).toBe('MEDIUM');
    });

    it('should transition incorrect MEDIUM -> EASY', () => {
      expect(adaptiveService.nextDifficulty('MEDIUM', false)).toBe('EASY');
    });

    it('should transition incorrect EASY -> EASY', () => {
      expect(adaptiveService.nextDifficulty('EASY', false)).toBe('EASY');
    });
  });

  // =========================================================================
  // 2. ANSWER EVALUATION TESTS
  // =========================================================================
  describe('2. Answer Evaluation & Formatting', () => {
    it('should accept exact matching numbers', () => {
      expect(adaptiveService.evaluateAnswer('6', '6')).toBe(true);
      expect(adaptiveService.evaluateAnswer('10', '10')).toBe(true);
      expect(adaptiveService.evaluateAnswer('-9', '-9')).toBe(true);
    });

    it('should handle whitespace and case normalization', () => {
      expect(adaptiveService.evaluateAnswer('  6  ', '6')).toBe(true);
      expect(adaptiveService.evaluateAnswer(' 10 ', '10')).toBe(true);
    });

    it('should accept variable equation prefix notation (e.g. x=6, x = 6, X = 6)', () => {
      expect(adaptiveService.evaluateAnswer('x=6', '6')).toBe(true);
      expect(adaptiveService.evaluateAnswer('x = 6', '6')).toBe(true);
      expect(adaptiveService.evaluateAnswer('X = 6', '6')).toBe(true);
      expect(adaptiveService.evaluateAnswer('y = 7', '7')).toBe(true);
      expect(adaptiveService.evaluateAnswer('m=17', '17')).toBe(true);
    });

    it('should reject incorrect answers', () => {
      expect(adaptiveService.evaluateAnswer('5', '6')).toBe(false);
      expect(adaptiveService.evaluateAnswer('x = 12', '6')).toBe(false);
      expect(adaptiveService.evaluateAnswer('garbage', '6')).toBe(false);
      expect(adaptiveService.evaluateAnswer('', '6')).toBe(false);
    });

    it('should handle decimal equivalence', () => {
      expect(adaptiveService.evaluateAnswer('6.5', '6.5')).toBe(true);
      expect(adaptiveService.evaluateAnswer('x = 6.50', '6.5')).toBe(true);
    });
  });

  // =========================================================================
  // 3. DATA INTEGRITY & ATTEMPT TRACKING
  // =========================================================================
  describe('3. Data Integrity & Server-Derived Correctness', () => {
    it('should record an attempt exactly once with server-derived correctness', () => {
      const student = service.enrollStudent({
        displayName: 'Test Learner',
        guardianName: 'Guardian Name',
        consentConfirmed: true,
      });

      const initialHistory = service.getAttemptsForStudent(student.id);
      expect(initialHistory.length).toBe(0);

      // Submit correct answer to eq-easy-01 ("6")
      const result = service.submitAttempt(student.id, 'eq-easy-01', '6');

      expect(result.correct).toBe(true);
      expect(result.newDifficulty).toBe('MEDIUM');
      expect(result.explanation).toContain('Subtract 4');

      const historyAfter = service.getAttemptsForStudent(student.id);
      expect(historyAfter.length).toBe(1);
      expect(historyAfter[0].studentId).toBe(student.id);
      expect(historyAfter[0].itemId).toBe('eq-easy-01');
      expect(historyAfter[0].correct).toBe(true);
    });

    it('should never trust client for correctness evaluation', () => {
      const student = service.enrollStudent({
        displayName: 'Cheating Attempt Learner',
        guardianName: 'Guardian',
        consentConfirmed: true,
      });

      // User submits wrong answer
      const result = service.submitAttempt(student.id, 'eq-easy-01', '999');

      expect(result.correct).toBe(false);
      expect(result.newDifficulty).toBe('EASY');
    });

    it('should block enrollment without explicit guardian consent', () => {
      expect(() => {
        service.enrollStudent({
          displayName: 'No Consent Child',
          guardianName: 'Parent',
          consentConfirmed: false,
        });
      }).toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 4. TEACHER AUTHORIZATION & SCOPE
  // =========================================================================
  describe('4. Teacher Authorization & Security Boundaries', () => {
    it('should allow authorized teacher to set override', () => {
      const override = controller.setTeacherOverride(
        {
          teacherId: 'teacher-mrs-sharma',
          studentId: 'student-b',
          type: 'NEEDS_HELP',
          notes: 'Student struggled with subtraction balance concept.',
        },
        'TEACHER',
      );

      expect(override.status).toBe('ACTIVE');
      expect(override.type).toBe('NEEDS_HELP');
      expect(override.studentId).toBe('student-b');
    });

    it('should strictly prohibit students from overriding their own learning plan', () => {
      expect(() => {
        controller.setTeacherOverride(
          {
            teacherId: 'student-b',
            studentId: 'student-b',
            type: 'NEEDS_HELP',
          },
          'STUDENT',
        );
      }).toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 5. OVERRIDE BEHAVIOR & PRECEDENCE (STEP 7 & 10)
  // =========================================================================
  describe('5. Teacher Override Execution & Precedence', () => {
    it('should alter student next question when teacher triggers NEEDS_HELP', () => {
      // 1. Enroll fresh student
      const student = service.enrollStudent({
        displayName: 'Dev Learner',
        guardianName: 'Guardian Dev',
        consentConfirmed: true,
      });

      // 2. Student starts and gets an easy question, answers correctly to reach MEDIUM
      const session = service.startSession(student.id);
      expect(session.currentDifficulty).toBe('EASY');

      const res1 = service.submitAttempt(student.id, 'eq-easy-01', '6');
      expect(res1.correct).toBe(true);
      expect(res1.newDifficulty).toBe('MEDIUM'); // normally would stay at MEDIUM or go to HARD

      // 3. Teacher observes student and triggers [ NEEDS HELP ]
      service.setTeacherOverride({
        teacherId: 'teacher-mrs-sharma',
        studentId: student.id,
        type: 'NEEDS_HELP',
        notes: 'Needs conceptual reinforcement.',
      });

      // 4. Student submits next attempt (even if correct on medium question)
      const res2 = service.submitAttempt(student.id, 'eq-med-01', '18');

      // The teacher override MUST take precedence and force difficulty to EASY!
      expect(res2.overrideApplied).toBe('TEACHER_NEEDS_HELP');
      expect(res2.newDifficulty).toBe('EASY');
      expect(res2.nextItem.difficulty).toBe('EASY');

      // 5. Verify teacher overview reports this student status
      const overview = service.getTeacherOverview('teacher-mrs-sharma');
      const studentRow = overview.find((r) => r.studentId === student.id);
      expect(studentRow).toBeDefined();
      expect(studentRow?.attemptsCount).toBe(2);
      expect(studentRow?.correctCount).toBe(2);
    });

    it('should not allow AI or standard adaptive logic to silently overwrite active teacher override', () => {
      const student = service.enrollStudent({
        displayName: 'Override Protected Student',
        guardianName: 'Guardian',
        consentConfirmed: true,
      });

      // Teacher sets override to target specific item
      service.setTeacherOverride({
        teacherId: 'teacher-mrs-sharma',
        studentId: student.id,
        type: 'NEXT_ITEM',
        targetDifficulty: 'EASY',
        targetItemId: 'eq-easy-04',
      });

      // Next attempt submitted
      const res = service.submitAttempt(student.id, 'eq-easy-01', '6');
      expect(res.nextItem.id).toBe('eq-easy-04');
    });
  });

  // =========================================================================
  // 6. CONTENT VERIFICATION
  // =========================================================================
  describe('6. Hand-Authored Content Suite', () => {
    it('should have 18 curated items with 6 of each difficulty tier', () => {
      const easy = V01_LEARNING_ITEMS.filter((i) => i.difficulty === 'EASY');
      const med = V01_LEARNING_ITEMS.filter((i) => i.difficulty === 'MEDIUM');
      const hard = V01_LEARNING_ITEMS.filter((i) => i.difficulty === 'HARD');

      expect(V01_LEARNING_ITEMS.length).toBe(18);
      expect(easy.length).toBe(6);
      expect(med.length).toBe(6);
      expect(hard.length).toBe(6);

      for (const item of V01_LEARNING_ITEMS) {
        expect(item.question.length).toBeGreaterThan(5);
        expect(item.answer.length).toBeGreaterThan(0);
        expect(item.explanation.length).toBeGreaterThan(10);
        expect(item.conceptId).toBe('one-step-equations');
      }
    });
  });

  // =========================================================================
  // 7. TASK LOGGER & EXECUTION CONTROL TESTS
  // =========================================================================
  describe('7. Task Logger & Execution Control Service', () => {
    it('should seed baseline task logs for verified tracks', () => {
      const logs = taskLogger.getTaskLogs();
      expect(logs.length).toBeGreaterThanOrEqual(7);

      const b1 = logs.find((l) => l.taskId === 'TASK-V01-B1');
      expect(b1).toBeDefined();
      expect(b1?.status).toBe('INTERNAL_VERIFIED');
      expect(b1?.verifiedBy).toBe('Core Systems Architect');
    });

    it('should log new task transitions with evidence and verifier', () => {
      const testTaskId = `TASK-V01-TEST-${Math.random().toString(36).substring(2, 8)}`;
      const entry = taskLogger.logTask({
        taskId: testTaskId,
        track: 'F',
        title: 'Bottleneck Root Cause Analysis',
        status: 'INTERNAL_VERIFIED',
        evidence: 'Session trace confirms 0% dropoff on equation fractions.',
        verifiedBy: 'Lead Educational Researcher',
      });

      expect(entry.id).toBeDefined();
      expect(entry.status).toBe('INTERNAL_VERIFIED');
      expect(entry.evidence).toContain('0% dropoff');

      const queried = taskLogger.getTaskLogs({ taskId: testTaskId });
      expect(queried.length).toBe(1);
      expect(queried[0].verifiedBy).toBe('Lead Educational Researcher');
    });

    it('should reject task logs missing mandatory fields', () => {
      expect(() => {
        taskLogger.logTask({
          taskId: '',
          track: 'B',
          title: 'Missing info',
          status: 'IMPLEMENTED',
          evidence: '',
          verifiedBy: '',
        });
      }).toThrow(BadRequestException);
    });

    it('should expose task logs and status via controller endpoints', () => {
      const controllerLogs = controller.getTaskLogs();
      expect(Array.isArray(controllerLogs)).toBe(true);
      expect(controllerLogs.length).toBeGreaterThan(0);

      const statusMap = controller.getLatestTaskStatus();
      expect(statusMap['TASK-V01-B1']).toBeDefined();
      expect(statusMap['TASK-V01-B1'].status).toBe('INTERNAL_VERIFIED');
    });
  });
});
