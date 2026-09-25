import { SecurityAssuranceEvaluator } from '../rules/evaluators/security-assurance.evaluator';

describe('SecurityAssuranceEvaluator (LKC-14)', () => {
  let evaluator: SecurityAssuranceEvaluator;

  beforeEach(() => {
    evaluator = new SecurityAssuranceEvaluator();
  });

  it('should block cross-tenant access with CRITICAL severity (SEC-001)', () => {
    const checks = evaluator.evaluate({
      targetId: 'res-1',
      actorTenantId: 'tenant-a',
      targetTenantId: 'tenant-b',
      actorRole: 'TEACHER',
    });

    const tenantCheck = checks.find((c) => c.checkId === 'SEC-001');
    expect(tenantCheck).toBeDefined();
    expect(tenantCheck?.status).toBe('FAIL');
    expect(tenantCheck?.severity).toBe('CRITICAL');
    expect(tenantCheck?.message).toContain('SEC-001: Tenant boundary violation');
  });

  it('should pass tenant isolation when actor and target tenant match', () => {
    const checks = evaluator.evaluate({
      targetId: 'res-1',
      actorTenantId: 'tenant-a',
      targetTenantId: 'tenant-a',
      actorRole: 'TEACHER',
    });

    const tenantCheck = checks.find((c) => c.checkId === 'SEC-001');
    expect(tenantCheck?.status).toBe('PASS');
  });

  it('should detect role boundary violation when actor lacks required role', () => {
    const checks = evaluator.evaluate({
      targetId: 'res-2',
      actorTenantId: 'tenant-a',
      targetTenantId: 'tenant-a',
      actorRole: 'STUDENT',
      requiredRole: 'TEACHER',
    });

    const roleCheck = checks.find((c) => c.checkId === 'SEC-003');
    expect(roleCheck?.status).toBe('FAIL');
    expect(roleCheck?.severity).toBe('HIGH');
  });

  it('should detect missing audit record on sensitive action as AUDIT_INTEGRITY_FAILURE (SEC-002)', () => {
    const checks = evaluator.evaluate({
      targetId: 'res-3',
      actorTenantId: 'tenant-a',
      targetTenantId: 'tenant-a',
      actorRole: 'ADMIN',
      isSensitiveAction: true,
      hasAuditRecord: false, // Missing audit!
    });

    const auditCheck = checks.find((c) => c.checkId === 'SEC-002');
    expect(auditCheck).toBeDefined();
    expect(auditCheck?.status).toBe('FAIL');
    expect(auditCheck?.severity).toBe('CRITICAL');
    expect(auditCheck?.message).toContain('AUDIT_INTEGRITY_FAILURE');
  });

  it('should pass audit check when sensitive action has verified audit record', () => {
    const checks = evaluator.evaluate({
      targetId: 'res-4',
      actorTenantId: 'tenant-a',
      targetTenantId: 'tenant-a',
      actorRole: 'ADMIN',
      isSensitiveAction: true,
      hasAuditRecord: true,
    });

    const auditCheck = checks.find((c) => c.checkId === 'SEC-002');
    expect(auditCheck?.status).toBe('PASS');
  });
});
