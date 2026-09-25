import { Injectable } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class PersonalizationAssuranceEvaluator {
  evaluate(context: {
    learnerId: string;
    consecutiveSameRecommendationCount: number;
    prerequisiteBypassed?: boolean;
    activeAssignmentConflict?: boolean;
    overRemediationTriggered?: boolean;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // 1. Repetition Loop Check (PERS-001)
    if (context.consecutiveSameRecommendationCount >= 3) {
      checks.push({
        checkId: 'PERS-001',
        category: 'REPETITION_LOOP',
        status: 'WARNING',
        message: `Learner '${context.learnerId}' received ${context.consecutiveSameRecommendationCount} identical consecutive recommendations. Potential loop detected.`,
        evidenceIds: [context.learnerId],
        severity: 'MEDIUM',
      });
    } else {
      checks.push({
        checkId: 'PERS-001',
        category: 'REPETITION_LOOP',
        status: 'PASS',
        message: 'No abnormal recommendation loops detected.',
        evidenceIds: [context.learnerId],
        severity: 'LOW',
      });
    }

    // 2. Prerequisite Bypass Check
    if (context.prerequisiteBypassed) {
      checks.push({
        checkId: 'PERS-002',
        category: 'PREREQUISITE_INTEGRITY',
        status: 'WARNING',
        message: `Personalization path bypassed required prerequisite for learner '${context.learnerId}'.`,
        evidenceIds: [context.learnerId],
        severity: 'HIGH',
      });
    }

    // 3. Assignment Conflict Check
    if (context.activeAssignmentConflict) {
      checks.push({
        checkId: 'PERS-003',
        category: 'ASSIGNMENT_CONFLICT',
        status: 'WARNING',
        message: `Conflicting active assignments detected for learner '${context.learnerId}'.`,
        evidenceIds: [context.learnerId],
        severity: 'LOW',
      });
    }

    return checks;
  }
}
