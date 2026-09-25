import { Injectable } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class AssessmentAssuranceEvaluator {
  evaluate(question: {
    id: string;
    objectiveId?: string;
    lessonObjectiveIds?: string[];
    correctAnswersCount: number;
    difficultyMetadata?: number;
    isArchivedKnowledge?: boolean;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // 1. Objective Alignment (ASSESS-001)
    if (!question.objectiveId) {
      checks.push({
        checkId: 'ASSESS-001',
        category: 'OBJECTIVE_ALIGNMENT',
        status: 'WARNING',
        message: `Question '${question.id}' is not mapped to any learning objective.`,
        evidenceIds: [question.id],
        severity: 'HIGH',
      });
    } else if (
      question.lessonObjectiveIds &&
      !question.lessonObjectiveIds.includes(question.objectiveId)
    ) {
      checks.push({
        checkId: 'ASSESS-001',
        category: 'OBJECTIVE_ALIGNMENT',
        status: 'WARNING',
        message: `Question '${question.id}' maps to an objective not represented in the lesson.`,
        evidenceIds: [question.id],
        severity: 'HIGH',
      });
    } else {
      checks.push({
        checkId: 'ASSESS-001',
        category: 'OBJECTIVE_ALIGNMENT',
        status: 'PASS',
        message: 'Question aligns with lesson objective.',
        evidenceIds: [question.id],
        severity: 'LOW',
      });
    }

    // 2. Answer Integrity (ASSESS-002)
    if (question.correctAnswersCount === 0) {
      checks.push({
        checkId: 'ASSESS-002',
        category: 'ANSWER_INTEGRITY',
        status: 'FAIL',
        message: `Question '${question.id}' has no valid correct answer configured.`,
        evidenceIds: [question.id],
        severity: 'CRITICAL',
      });
    } else if (question.correctAnswersCount > 1) {
      checks.push({
        checkId: 'ASSESS-002',
        category: 'ANSWER_INTEGRITY',
        status: 'FAIL',
        message: `Question '${question.id}' has multiple unintended correct answers.`,
        evidenceIds: [question.id],
        severity: 'CRITICAL',
      });
    } else {
      checks.push({
        checkId: 'ASSESS-002',
        category: 'ANSWER_INTEGRITY',
        status: 'PASS',
        message: 'Answer integrity validated (single unambiguous correct answer).',
        evidenceIds: [question.id],
        severity: 'LOW',
      });
    }

    // 3. Difficulty Metadata
    if (question.difficultyMetadata === undefined || question.difficultyMetadata === null) {
      checks.push({
        checkId: 'ASSESS-003',
        category: 'DIFFICULTY_METADATA',
        status: 'WARNING',
        message: `Question '${question.id}' lacks calibrated difficulty metadata.`,
        evidenceIds: [question.id],
        severity: 'LOW',
      });
    }

    return checks;
  }
}
