import {
  TenantSecurityBoundary,
  SecurityContext,
} from './tenant-security.boundary';

describe('TenantSecurityBoundary', () => {
  it('should throw if tenantId is missing or empty', () => {
    expect(() => TenantSecurityBoundary.assertTenant('')).toThrow(
      /Security Violation: Missing tenant context/,
    );
    expect(() => TenantSecurityBoundary.assertTenant(undefined)).toThrow(
      /Security Violation: Missing tenant context/,
    );
  });

  it('should allow STUDENT to read published knowledge and emit evidence', () => {
    const studentContext: SecurityContext = {
      tenantId: 'tenant-delhi-1',
      userId: 'student-123',
      role: 'STUDENT',
    };

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(studentContext, 'READ_PUBLISHED'),
    ).not.toThrow();

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(studentContext, 'EMIT_EVIDENCE'),
    ).not.toThrow();
  });

  it('should forbid STUDENT from creating or publishing knowledge', () => {
    const studentContext: SecurityContext = {
      tenantId: 'tenant-delhi-1',
      userId: 'student-123',
      role: 'STUDENT',
    };

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(studentContext, 'CREATE_KNOWLEDGE'),
    ).toThrow(/Security Violation: Role 'STUDENT' is not authorized to perform action 'CREATE_KNOWLEDGE'/);

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(studentContext, 'PUBLISH'),
    ).toThrow(/Security Violation: Role 'STUDENT' is not authorized to perform action 'PUBLISH'/);
  });

  it('should allow TEACHER to create and edit knowledge', () => {
    const teacherContext: SecurityContext = {
      tenantId: 'tenant-delhi-1',
      userId: 'teacher-456',
      role: 'TEACHER',
    };

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(teacherContext, 'CREATE_KNOWLEDGE'),
    ).not.toThrow();

    expect(() =>
      TenantSecurityBoundary.assertAuthorized(teacherContext, 'EDIT_KNOWLEDGE'),
    ).not.toThrow();
  });
});
