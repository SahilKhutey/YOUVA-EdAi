import { Injectable } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class OperationsAssuranceEvaluator {
  evaluate(opsContext: {
    targetId: string;
    subsystem: 'EVIDENCE' | 'ANALYTICS' | 'INSTITUTIONAL';
    latencySeconds: number;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // SLAs in seconds
    const slas: Record<string, number> = {
      EVIDENCE: 30,
      ANALYTICS: 300, // 5 min
      INSTITUTIONAL: 3600, // 1 hour
    };

    const slaLimit = slas[opsContext.subsystem] ?? 300;

    if (opsContext.latencySeconds > slaLimit) {
      checks.push({
        checkId: 'OPS-001',
        category: 'SLA_FRESHNESS',
        status: 'WARNING',
        message: `OPS-001: Subsystem '${opsContext.subsystem}' latency of ${opsContext.latencySeconds}s exceeds SLA limit of ${slaLimit}s. Stale intelligence flagged.`,
        evidenceIds: [opsContext.targetId],
        severity: 'MEDIUM',
      });
    } else {
      checks.push({
        checkId: 'OPS-001',
        category: 'SLA_FRESHNESS',
        status: 'PASS',
        message: `Subsystem '${opsContext.subsystem}' freshness within SLA (${opsContext.latencySeconds}s <= ${slaLimit}s).`,
        evidenceIds: [opsContext.targetId],
        severity: 'LOW',
      });
    }

    return checks;
  }
}
