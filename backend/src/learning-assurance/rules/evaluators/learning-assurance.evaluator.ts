import { Injectable } from '@nestjs/common';
import { DecisionAssurance } from '../../domain/assurance.types';

@Injectable()
export class LearningAssuranceEvaluator {
  evaluate(decision: {
    decisionId: string;
    evidenceIds?: string[];
    learnerStateUpdatedAt?: Date;
    actorRole?: string;
    targetLearnerId?: string;
    policyVersion?: string;
  }): DecisionAssurance {
    const violations: string[] = [];

    // 1. Evidence Valid
    const evidenceValid = !!(decision.evidenceIds && decision.evidenceIds.length > 0);
    if (!evidenceValid) {
      violations.push('Decision lacked valid learning evidence references.');
    }

    // 2. Learner State Valid & Fresh (within 7 days)
    let learnerStateValid = true;
    if (decision.learnerStateUpdatedAt) {
      const ageMs = Date.now() - new Date(decision.learnerStateUpdatedAt).getTime();
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      if (ageMs > maxAgeMs) {
        learnerStateValid = false;
        violations.push('Decision used stale learner state (> 7 days).');
      }
    } else {
      learnerStateValid = false;
      violations.push('Missing learner state timestamp.');
    }

    // 3. Authorization Valid
    const authorizationValid = decision.actorRole !== 'UNAUTHORIZED';
    if (!authorizationValid) {
      violations.push('Actor unauthorized for adaptive decision.');
    }

    // 4. Target Valid
    const targetValid = !!decision.targetLearnerId;
    if (!targetValid) {
      violations.push('Missing target learner ID.');
    }

    const policyValid = !!decision.policyVersion;
    if (!policyValid) {
      violations.push('Missing decision policy version.');
    }

    let status: 'PASS' | 'WARNING' | 'BLOCK' = 'PASS';
    if (!authorizationValid || !targetValid) {
      status = 'BLOCK';
    } else if (!evidenceValid || !learnerStateValid || !policyValid) {
      status = 'WARNING';
    }

    return {
      decisionId: decision.decisionId,
      evidenceValid,
      learnerStateValid,
      policyValid,
      authorizationValid,
      targetValid,
      violations,
      status,
    };
  }
}
