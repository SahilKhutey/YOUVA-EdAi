/**
 * YOUVA-EdAI: Tenant & Security Boundary (LKC-0)
 * 
 * Enforces multi-tenant isolation and Role-Based Access Control (RBAC)
 * on every Knowledge Cycle transaction.
 */

export type PlatformRole =
  | 'STUDENT'
  | 'TEACHER'
  | 'REVIEWER'
  | 'ADMIN';

export interface SecurityContext {
  tenantId: string;
  userId: string;
  role: PlatformRole;
  permittedSubjectIds?: string[];
}

export class TenantSecurityBoundary {
  /**
   * Asserts that the request carries a valid, non-empty tenant ID.
   */
  public static assertTenant(tenantId?: string): void {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('Security Violation: Missing tenant context for knowledge operation');
    }
  }

  /**
   * Validates if the actor is permitted to perform the requested operation.
   */
  public static assertAuthorized(
    context: SecurityContext,
    action:
      | 'READ_PUBLISHED'
      | 'READ_DRAFTS'
      | 'CREATE_KNOWLEDGE'
      | 'EDIT_KNOWLEDGE'
      | 'SUBMIT_REVIEW'
      | 'APPROVE_REJECT'
      | 'PUBLISH'
      | 'ARCHIVE'
      | 'EMIT_EVIDENCE',
  ): void {
    this.assertTenant(context.tenantId);

    switch (action) {
      case 'READ_PUBLISHED':
        // All roles can read published canonical knowledge
        return;

      case 'EMIT_EVIDENCE':
        // Students and Teachers can emit evidence
        if (['STUDENT', 'TEACHER', 'ADMIN'].includes(context.role)) return;
        break;

      case 'READ_DRAFTS':
      case 'CREATE_KNOWLEDGE':
      case 'EDIT_KNOWLEDGE':
      case 'SUBMIT_REVIEW':
        if (['TEACHER', 'ADMIN'].includes(context.role)) return;
        break;

      case 'APPROVE_REJECT':
        if (['REVIEWER', 'ADMIN'].includes(context.role)) return;
        break;

      case 'PUBLISH':
      case 'ARCHIVE':
        if (['ADMIN', 'TEACHER'].includes(context.role)) return;
        break;
    }

    throw new Error(
      `Security Violation: Role '${context.role}' is not authorized to perform action '${action}' in tenant '${context.tenantId}'`,
    );
  }
}
