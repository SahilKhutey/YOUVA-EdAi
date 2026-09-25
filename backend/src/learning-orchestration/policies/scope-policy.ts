import { Injectable, Logger } from '@nestjs/common';
import {
  OrchestrationScope,
  SCOPE_HIERARCHY_LEVELS,
} from '../domain/orchestration.types';

export interface ScopeValidationResult {
  allowed: boolean;
  workflowScope: OrchestrationScope;
  targetScope: OrchestrationScope;
  reason?: string;
}

@Injectable()
export class ScopePolicy {
  private readonly logger = new Logger(ScopePolicy.name);

  validateScope(
    workflowScope: OrchestrationScope,
    targetScope: OrchestrationScope,
  ): ScopeValidationResult {
    const workflowLevel = SCOPE_HIERARCHY_LEVELS[workflowScope] ?? 0;
    const targetLevel = SCOPE_HIERARCHY_LEVELS[targetScope] ?? 0;

    if (targetLevel > workflowLevel) {
      const reason = `Scope Escalation Violation: Workflow at scope '${workflowScope}' (level ${workflowLevel}) cannot target '${targetScope}' (level ${targetLevel}). Cross-scope mutation denied.`;
      this.logger.warn(reason);
      return {
        allowed: false,
        workflowScope,
        targetScope,
        reason,
      };
    }

    return {
      allowed: true,
      workflowScope,
      targetScope,
    };
  }

  validateTenant(
    orchestrationTenantId: string,
    targetTenantId?: string,
  ): { allowed: boolean; reason?: string } {
    if (!targetTenantId) {
      return { allowed: true };
    }

    if (orchestrationTenantId !== targetTenantId) {
      const reason = `Tenant Isolation Violation: Orchestration belongs to tenant '${orchestrationTenantId}' but target belongs to tenant '${targetTenantId}'.`;
      this.logger.error(reason);
      return { allowed: false, reason };
    }

    return { allowed: true };
  }
}
