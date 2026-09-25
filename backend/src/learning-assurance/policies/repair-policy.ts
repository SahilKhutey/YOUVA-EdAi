import { Injectable, Logger } from '@nestjs/common';
import { RepairPermission } from '../domain/assurance.types';

export interface RepairEvaluationResult {
  permission: RepairPermission;
  allowed: boolean;
  reason: string;
}

@Injectable()
export class RepairPolicy {
  private readonly logger = new Logger(RepairPolicy.name);

  private readonly autoRepairActions = new Set([
    'REBUILD_CACHE',
    'REINDEX_SEARCH',
    'REPLAY_EVENT',
    'RECALCULATE_ANALYTICS',
    'REFRESH_MATERIALIZED_VIEW',
  ]);

  private readonly humanApprovalActions = new Set([
    'MANUAL_PEDAGOGICAL_FIX',
    'REVISE_OBJECTIVE',
    'MODIFY_ASSESSMENT',
    'CURRICULUM_REALIGNMENT',
    'UPDATE_PREREQUISITE',
  ]);

  private readonly blockedActions = new Set([
    'CROSS_TENANT_MUTATION',
    'AUDIT_LOG_ALTERATION',
    'HISTORICAL_EVIDENCE_MUTATION',
    'OVERRIDE_SECURITY_BOUNDARY',
    'DIRECT_MASTERY_MUTATION',
  ]);

  evaluateRepairPermission(action: string, targetType: string): RepairEvaluationResult {
    // 1. Prohibited Actions
    if (this.blockedActions.has(action) || targetType === 'AUDIT_LOG' || targetType === 'HISTORICAL_EVIDENCE') {
      const reason = `Prohibited repair action '${action}' on target '${targetType}'. Security, audit, and historical evidence boundaries cannot be automatically repaired.`;
      this.logger.error(reason);
      return {
        permission: 'BLOCKED',
        allowed: false,
        reason,
      };
    }

    // 2. Safe Auto-Repair (Derived data)
    if (this.autoRepairActions.has(action)) {
      return {
        permission: 'AUTO_REPAIR',
        allowed: true,
        reason: `Safe derived data operation '${action}' approved for autonomous repair.`,
      };
    }

    // 3. Human Approval Required (Pedagogical content)
    if (this.humanApprovalActions.has(action)) {
      return {
        permission: 'HUMAN_APPROVAL',
        allowed: false,
        reason: `Pedagogical repair action '${action}' requires authorized educator/curriculum review.`,
      };
    }

    // Default: Human approval required
    return {
      permission: 'HUMAN_APPROVAL',
      allowed: false,
      reason: `Action '${action}' not classified for autonomous repair. Human review required.`,
    };
  }
}
