import { Injectable } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class DataAssuranceEvaluator {
  evaluate(dataContext: {
    targetId: string;
    hasDuplicateEvents?: boolean;
    hasOrphanRecord?: boolean;
    isHistoricalEvidence?: boolean;
    evidenceVersion?: string;
    currentVersion?: string;
    missingRequiredField?: boolean;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // 1. Duplicate Events
    if (dataContext.hasDuplicateEvents) {
      checks.push({
        checkId: 'DATA-002',
        category: 'EVENT_INTEGRITY',
        status: 'WARNING',
        message: `Duplicate learning event detected for target '${dataContext.targetId}'. Idempotency layer should deduplicate.`,
        evidenceIds: [dataContext.targetId],
        severity: 'MEDIUM',
      });
    }

    // 2. Orphan Reference (DATA-001)
    if (dataContext.hasOrphanRecord) {
      checks.push({
        checkId: 'DATA-001',
        category: 'ORPHAN_REFERENCE',
        status: 'FAIL',
        message: `Orphan record found: target '${dataContext.targetId}' references non-existent parent entity.`,
        evidenceIds: [dataContext.targetId],
        severity: 'HIGH',
      });
    } else {
      checks.push({
        checkId: 'DATA-001',
        category: 'ORPHAN_REFERENCE',
        status: 'PASS',
        message: 'Relational integrity intact.',
        evidenceIds: [dataContext.targetId],
        severity: 'LOW',
      });
    }

    // 3. Historical vs Current Version Check (Evidence Integrity Invariant)
    if (
      dataContext.isHistoricalEvidence &&
      dataContext.evidenceVersion &&
      dataContext.currentVersion &&
      dataContext.evidenceVersion !== dataContext.currentVersion
    ) {
      // Historical evidence remaining tied to older version is VALID by architectural design!
      checks.push({
        checkId: 'DATA-003',
        category: 'HISTORICAL_INTEGRITY',
        status: 'PASS',
        message: `Historical evidence preserved with original version ${dataContext.evidenceVersion} (current: ${dataContext.currentVersion}).`,
        evidenceIds: [dataContext.targetId],
        severity: 'INFO',
      });
    }

    return checks;
  }
}
