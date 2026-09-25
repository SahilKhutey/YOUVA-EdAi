import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  Student,
  Attempt,
  LearningItem,
  TeacherOverride,
  StudentProgressSummary,
  Difficulty,
  EnrollStudentDto,
  TeacherOverrideDto,
} from './v01.types';
import { V01AdaptiveService } from './v01-adaptive.service';
import { V01_LEARNING_ITEMS, CONCEPT_ID, CONCEPT_NAME } from './v01-content';

@Injectable()
export class V01Service {
  private readonly logger = new Logger(V01Service.name);

  // In-memory data store for v0.1
  private readonly students = new Map<string, Student>();
  private readonly attempts: Attempt[] = [];
  private readonly overrides = new Map<string, TeacherOverride>(); // keyed by studentId
  private readonly currentStudentDifficulty = new Map<string, Difficulty>(); // keyed by studentId

  // File persistence for append-only pilot audit log
  private readonly logDir = path.resolve(process.cwd(), 'data');
  private readonly logFilePath = path.resolve(this.logDir, 'v01_pilot_attempts.jsonl');

  constructor(private readonly adaptiveService: V01AdaptiveService) {
    this.ensureStorage();
  }

  private ensureStorage() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      this.logger.warn(`Could not initialize data log directory: ${err.message}`);
    }
  }

  private persistAttemptLog(attempt: Attempt) {
    try {
      fs.appendFileSync(this.logFilePath, JSON.stringify(attempt) + '\n', 'utf8');
    } catch (err) {
      this.logger.warn(`Failed to append attempt to ${this.logFilePath}: ${err.message}`);
    }
  }

  /**
   * Enroll a student with documented guardian consent (Step 0 & 9).
   */
  enrollStudent(dto: EnrollStudentDto): Student {
    if (!dto.displayName || dto.displayName.trim().length === 0) {
      throw new BadRequestException('displayName is required');
    }
    if (!dto.guardianName || dto.guardianName.trim().length === 0) {
      throw new BadRequestException('guardianName is required for middle school student');
    }
    if (!dto.consentConfirmed) {
      throw new ForbiddenException('Documented guardian consent is required before student enrollment.');
    }

    const id = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const student: Student = {
      id,
      displayName: dto.displayName.trim(),
      guardianName: dto.guardianName.trim(),
      consentConfirmed: true,
      enrolledAt: new Date().toISOString(),
    };

    this.students.set(id, student);
    this.currentStudentDifficulty.set(id, 'EASY');
    this.logger.log(`Student enrolled: ${student.displayName} (ID: ${id}) with guardian consent.`);
    return student;
  }

  getStudent(studentId: string): Student {
    const student = this.students.get(studentId);
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }
    return student;
  }

  /**
   * Starts a learning session for the student.
   * Returns diagnostic / first question.
   */
  startSession(studentId: string): { student: Student; firstItem: LearningItem; currentDifficulty: Difficulty } {
    const student = this.getStudent(studentId);
    if (!student.consentConfirmed) {
      throw new ForbiddenException('Guardian consent is missing for this student');
    }

    const currentDiff = this.currentStudentDifficulty.get(studentId) || 'EASY';
    const firstItem = this.adaptiveService.selectNextItem(currentDiff, []);

    return {
      student,
      firstItem,
      currentDifficulty: currentDiff,
    };
  }

  /**
   * Submit an attempt, evaluate answer, update difficulty, apply teacher overrides, and return next item.
   */
  submitAttempt(
    studentId: string,
    itemId: string,
    userAnswer: string,
  ): {
    attemptId: string;
    correct: boolean;
    explanation: string;
    previousDifficulty: Difficulty;
    newDifficulty: Difficulty;
    overrideApplied?: string;
    nextItem: LearningItem;
  } {
    const student = this.getStudent(studentId);

    const item = V01_LEARNING_ITEMS.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Learning item ${itemId} not found`);
    }

    // 1. Server-side correctness evaluation
    const isCorrect = this.adaptiveService.evaluateAnswer(userAnswer, item.answer);

    // 2. Base deterministic adaptive difficulty
    const currentDiff = this.currentStudentDifficulty.get(studentId) || item.difficulty;
    let nextDiff = this.adaptiveService.nextDifficulty(currentDiff, isCorrect);

    // 3. Teacher Override Check (INV-001 Consequential Human Priority)
    let overrideApplied: string | undefined = undefined;
    const activeOverride = this.overrides.get(studentId);

    if (activeOverride && activeOverride.status === 'ACTIVE') {
      if (activeOverride.type === 'NEEDS_HELP') {
        // Teacher requested help: force foundational/easy remediation
        nextDiff = activeOverride.targetDifficulty || 'EASY';
        overrideApplied = 'TEACHER_NEEDS_HELP';
        activeOverride.status = 'APPLIED';
        this.logger.log(`Applied teacher override NEEDS_HELP for student ${studentId}: forced difficulty -> ${nextDiff}`);
      } else if (activeOverride.type === 'NEXT_ITEM' && activeOverride.targetDifficulty) {
        nextDiff = activeOverride.targetDifficulty;
        overrideApplied = 'TEACHER_SET_DIFFICULTY';
        activeOverride.status = 'APPLIED';
      }
    }

    // Update student difficulty state
    this.currentStudentDifficulty.set(studentId, nextDiff);

    // 4. Record single immutable attempt
    const attempt: Attempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      itemId,
      conceptId: CONCEPT_ID,
      answer: userAnswer,
      correct: isCorrect,
      difficulty: item.difficulty,
      nextDifficulty: nextDiff,
      overrideApplied,
      createdAt: new Date().toISOString(),
    };

    this.attempts.push(attempt);
    this.persistAttemptLog(attempt);

    // 5. Select Next Item
    const studentPreviousItemIds = this.attempts
      .filter((a) => a.studentId === studentId)
      .map((a) => a.itemId);

    let nextItem: LearningItem;
    if (activeOverride && activeOverride.targetItemId) {
      const targeted = V01_LEARNING_ITEMS.find((i) => i.id === activeOverride.targetItemId);
      nextItem = targeted || this.adaptiveService.selectNextItem(nextDiff, studentPreviousItemIds);
    } else {
      nextItem = this.adaptiveService.selectNextItem(nextDiff, studentPreviousItemIds);
    }

    return {
      attemptId: attempt.id,
      correct: isCorrect,
      explanation: item.explanation,
      previousDifficulty: item.difficulty,
      newDifficulty: nextDiff,
      overrideApplied,
      nextItem,
    };
  }

  /**
   * Teacher Overview: Simple table of all students practicing the concept.
   */
  getTeacherOverview(teacherId: string = 'teacher-pilot'): StudentProgressSummary[] {
    const summaries: StudentProgressSummary[] = [];

    for (const [studentId, student] of this.students.entries()) {
      const studentAttempts = this.attempts.filter((a) => a.studentId === studentId);
      const attemptsCount = studentAttempts.length;
      const correctCount = studentAttempts.filter((a) => a.correct).length;
      const accuracyRate = attemptsCount > 0 ? Number((correctCount / attemptsCount).toFixed(2)) : 0.0;
      const currentDifficulty = this.currentStudentDifficulty.get(studentId) || 'EASY';

      const activeOverride = this.overrides.get(studentId);

      // Status: "NEEDS_HELP" if accuracy < 0.60 (with >= 3 attempts) or if teacher explicitly flagged
      let status: 'ON_TRACK' | 'NEEDS_HELP' = 'ON_TRACK';
      if ((attemptsCount >= 3 && accuracyRate < 0.60) || (activeOverride && activeOverride.status === 'ACTIVE')) {
        status = 'NEEDS_HELP';
      }

      summaries.push({
        studentId,
        displayName: student.displayName,
        conceptId: CONCEPT_ID,
        conceptName: CONCEPT_NAME,
        attemptsCount,
        correctCount,
        accuracyRate,
        currentDifficulty,
        status,
        activeOverride: activeOverride?.status === 'ACTIVE' ? activeOverride : undefined,
        lastAttemptAt: studentAttempts[studentAttempts.length - 1]?.createdAt,
      });
    }

    return summaries;
  }

  /**
   * Teacher Override action: teacher flags "NEEDS_HELP" or sets next item.
   */
  setTeacherOverride(dto: TeacherOverrideDto): TeacherOverride {
    if (!dto.teacherId || dto.teacherId.trim().length === 0) {
      throw new BadRequestException('teacherId is required');
    }
    if (!dto.studentId) {
      throw new BadRequestException('studentId is required');
    }
    const student = this.getStudent(dto.studentId);

    const override: TeacherOverride = {
      id: `ovr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      type: dto.type,
      targetDifficulty: dto.targetDifficulty || (dto.type === 'NEEDS_HELP' ? 'EASY' : undefined),
      targetItemId: dto.targetItemId,
      notes: dto.notes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.overrides.set(dto.studentId, override);
    this.logger.log(
      `Teacher ${dto.teacherId} set override [${dto.type}] on student ${student.displayName} (ID: ${dto.studentId})`,
    );

    return override;
  }

  clearTeacherOverride(teacherId: string, studentId: string): { success: boolean } {
    const existing = this.overrides.get(studentId);
    if (existing) {
      existing.status = 'DISMISSED';
    }
    return { success: true };
  }

  getAttemptsForStudent(studentId: string): Attempt[] {
    return this.attempts.filter((a) => a.studentId === studentId);
  }
}
