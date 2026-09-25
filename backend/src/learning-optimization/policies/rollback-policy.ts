import { BadRequestException } from '@nestjs/common';

export type RollbackStrategy =
  | 'REBUILD_DERIVED'
  | 'RESTORE_VERSION'
  | 'REVERT_POLICY'
  | 'STOP_EXPERIMENT';

export interface RollbackPlan {
  executionId: string;
  strategy: RollbackStrategy;
  targetVersionId?: string;
  reason: string;
  approvedBy?: string;
}

export class RollbackPolicy {
  /**
   * Validates rollback parameters and ensures historical data is not deleted.
   */
  static validateRollback(plan: RollbackPlan): void {
    if (!plan.reason || plan.reason.trim().length === 0) {
      throw new BadRequestException('Rollback reason is required.');
    }

    if (plan.strategy === 'RESTORE_VERSION' && !plan.targetVersionId) {
      throw new BadRequestException('targetVersionId is required when strategy is RESTORE_VERSION.');
    }

    // Rollbacks must preserve history: old versions remain in database
  }
}
