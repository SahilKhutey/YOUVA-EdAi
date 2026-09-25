import { Injectable } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class SecurityAssuranceEvaluator {
  evaluate(securityContext: {
    targetId: string;
    actorTenantId: string;
    targetTenantId: string;
    actorRole: string;
    requiredRole?: string;
    isSensitiveAction?: boolean;
    hasAuditRecord?: boolean;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // 1. Tenant Isolation (SEC-001)
    if (securityContext.actorTenantId !== securityContext.targetTenantId) {
      checks.push({
        checkId: 'SEC-001',
        category: 'TENANT_ISOLATION',
        status: 'FAIL',
        message: `SEC-001: Tenant boundary violation. Actor '${securityContext.actorTenantId}' attempted access to target in tenant '${securityContext.targetTenantId}'.`,
        evidenceIds: [securityContext.targetId],
        severity: 'CRITICAL',
      });
    } else {
      checks.push({
        checkId: 'SEC-001',
        category: 'TENANT_ISOLATION',
        status: 'PASS',
        message: 'Tenant isolation verified.',
        evidenceIds: [securityContext.targetId],
        severity: 'LOW',
      });
    }

    // 2. Role Boundaries
    if (
      securityContext.requiredRole &&
      securityContext.actorRole !== securityContext.requiredRole &&
      securityContext.actorRole !== 'SUPER_ADMIN'
    ) {
      checks.push({
        checkId: 'SEC-003',
        category: 'ROLE_AUTHORIZATION',
        status: 'FAIL',
        message: `Role boundary violation. Required: '${securityContext.requiredRole}', provided: '${securityContext.actorRole}'.`,
        evidenceIds: [securityContext.targetId],
        severity: 'HIGH',
      });
    }

    // 3. Audit Completeness & Missing Audit Detection (SEC-002)
    if (securityContext.isSensitiveAction && !securityContext.hasAuditRecord) {
      checks.push({
        checkId: 'SEC-002',
        category: 'AUDIT_INTEGRITY_FAILURE',
        status: 'FAIL',
        message: 'AUDIT_INTEGRITY_FAILURE: Sensitive mutation executed without mandatory provenance audit record.',
        evidenceIds: [securityContext.targetId],
        severity: 'CRITICAL',
      });
    } else if (securityContext.isSensitiveAction && securityContext.hasAuditRecord) {
      checks.push({
        checkId: 'SEC-002',
        category: 'AUDIT_INTEGRITY',
        status: 'PASS',
        message: 'Audit record verified for sensitive action.',
        evidenceIds: [securityContext.targetId],
        severity: 'LOW',
      });
    }

    return checks;
  }
}
