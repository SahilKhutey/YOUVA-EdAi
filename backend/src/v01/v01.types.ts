/**
 * YOUVA EdAI v0.1 — Minimum Domain Types
 * Hard Scope Boundary: One Middle School tier, Math, One-Step Linear Equations.
 */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Student {
  id: string;
  displayName: string;
  guardianName: string;
  consentConfirmed: boolean;
  enrolledAt: string;
}

export interface LearningItem {
  id: string;
  conceptId: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: Difficulty;
}

export interface Attempt {
  id: string;
  studentId: string;
  itemId: string;
  conceptId: string;
  answer: string;
  correct: boolean;
  difficulty: Difficulty;
  nextDifficulty: Difficulty;
  overrideApplied?: string;
  createdAt: string;
}

export interface TeacherOverride {
  id: string;
  teacherId: string;
  studentId: string;
  type: 'NEEDS_HELP' | 'NEXT_ITEM';
  targetDifficulty?: Difficulty;
  targetItemId?: string;
  notes?: string;
  status: 'ACTIVE' | 'APPLIED' | 'DISMISSED';
  createdAt: string;
}

export interface StudentProgressSummary {
  studentId: string;
  displayName: string;
  conceptId: string;
  conceptName: string;
  attemptsCount: number;
  correctCount: number;
  accuracyRate: number;
  currentDifficulty: Difficulty;
  status: 'ON_TRACK' | 'NEEDS_HELP';
  activeOverride?: TeacherOverride;
  lastAttemptAt?: string;
}

export interface AttemptSubmissionDto {
  itemId: string;
  answer: string;
}

export interface EnrollStudentDto {
  displayName: string;
  guardianName: string;
  consentConfirmed: boolean;
}

export interface TeacherOverrideDto {
  teacherId: string;
  studentId: string;
  type: 'NEEDS_HELP' | 'NEXT_ITEM';
  targetDifficulty?: Difficulty;
  targetItemId?: string;
  notes?: string;
}
