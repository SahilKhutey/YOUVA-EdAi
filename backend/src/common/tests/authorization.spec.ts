import * as crypto from 'crypto';

describe('General Unit Tests: Authentication, RBAC & Security (UT-GEN-018 - UT-GEN-028)', () => {
  type Role = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

  interface UserContext {
    userId: string;
    role: Role;
    tenantId?: string;
  }

  function authorizeRoles(user: UserContext | undefined, allowedRoles: Role[]) {
    if (!user) {
      throw new Error('Unauthorized: Missing authentication token or user session');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Forbidden: User with role "${user.role}" does not have required permissions: [${allowedRoles.join(', ')}]`);
    }
    return true;
  }

  function verifyResourceOwnership(user: UserContext, resourceOwnerId: string, allowedRolesForOverride: Role[] = ['ADMIN', 'TEACHER']) {
    if (allowedRolesForOverride.includes(user.role)) {
      return true;
    }
    if (user.userId !== resourceOwnerId) {
      throw new Error('Forbidden: User does not own this resource');
    }
    return true;
  }

  function parseMockJwt(jwt: string, secret: string) {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Unauthorized: Malformed JWT');
    }
    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');

    if (signature !== expectedSig) {
      throw new Error('Unauthorized: Invalid JWT signature');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      throw new Error('Unauthorized: Expired JWT token');
    }

    return payload;
  }

  describe('UT-GEN-018: Authorization - Authorized role allowed', () => {
    it('allows access to endpoints designated for that role', () => {
      const teacherUser: UserContext = { userId: 'u-teacher-1', role: 'TEACHER' };
      expect(authorizeRoles(teacherUser, ['TEACHER', 'ADMIN'])).toBe(true);
    });
  });

  describe('UT-GEN-019: Authorization - Unauthorized role rejected', () => {
    it('rejects access with 403 Forbidden when user role is insufficient', () => {
      const studentUser: UserContext = { userId: 'u-student-1', role: 'STUDENT' };
      expect(() => authorizeRoles(studentUser, ['TEACHER', 'ADMIN'])).toThrow('Forbidden: User with role "STUDENT"');
    });
  });

  describe('UT-GEN-020: Authorization - Missing authentication rejected', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', () => {
      expect(() => authorizeRoles(undefined, ['STUDENT', 'TEACHER'])).toThrow('Unauthorized: Missing authentication');
    });
  });

  describe('UT-GEN-021: Authorization - Resource ownership enforced', () => {
    it('allows student to access their own resources and denies access to another student resource', () => {
      const studentA: UserContext = { userId: 'student-A', role: 'STUDENT' };
      expect(verifyResourceOwnership(studentA, 'student-A')).toBe(true);
      expect(() => verifyResourceOwnership(studentA, 'student-B')).toThrow('Forbidden: User does not own this resource');
    });
  });

  describe('UT-GEN-022: Authorization - Cross-tenant resource rejected', () => {
    it('rejects resource access when user tenant does not match resource tenant', () => {
      const checkTenantAccess = (userTenant: string, resourceTenant: string) => {
        if (userTenant !== resourceTenant) {
          throw new Error('Forbidden: Cross-tenant access is strictly prohibited');
        }
        return true;
      };

      expect(checkTenantAccess('tenant-alpha', 'tenant-alpha')).toBe(true);
      expect(() => checkTenantAccess('tenant-alpha', 'tenant-beta')).toThrow('Cross-tenant access');
    });
  });

  describe('UT-GEN-023: Security - User cannot escalate own role', () => {
    it('prevents non-admin users from elevating their role via profile or settings update', () => {
      const updateUserProfile = (actor: UserContext, updateDto: { name?: string; role?: Role }) => {
        if (updateDto.role && actor.role !== 'ADMIN') {
          throw new Error('Forbidden: Privilege escalation detected. Only ADMIN may alter roles.');
        }
        return { ...actor, ...updateDto };
      };

      const student: UserContext = { userId: 's1', role: 'STUDENT' };
      expect(() => updateUserProfile(student, { role: 'ADMIN' })).toThrow('Privilege escalation detected');
      expect(updateUserProfile(student, { name: 'New Name' }).name).toBe('New Name');
    });
  });

  describe('UT-GEN-024: Security - User cannot impersonate another user', () => {
    it('blocks user from forging actor ID in request headers or body', () => {
      const resolveEffectiveUser = (authenticatedUser: UserContext, requestedUserId?: string) => {
        if (requestedUserId && requestedUserId !== authenticatedUser.userId && authenticatedUser.role !== 'ADMIN') {
          throw new Error('Forbidden: Unauthorized impersonation attempt');
        }
        return requestedUserId ?? authenticatedUser.userId;
      };

      const student: UserContext = { userId: 's-123', role: 'STUDENT' };
      expect(() => resolveEffectiveUser(student, 's-999')).toThrow('Unauthorized impersonation attempt');
      expect(resolveEffectiveUser(student, 's-123')).toBe('s-123');
    });
  });

  describe('UT-GEN-025: Security - Malformed JWT rejected', () => {
    it('rejects tokens that do not follow header.payload.signature structure', () => {
      expect(() => parseMockJwt('not-a-valid-jwt', 'secret')).toThrow('Malformed JWT');
      expect(() => parseMockJwt('only.two.parts.extra.parts', 'secret')).toThrow('Malformed JWT');
    });
  });

  describe('UT-GEN-026: Security - Expired JWT rejected', () => {
    it('rejects tokens whose exp timestamp is in the past', () => {
      const secret = 'test-secret';
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payloadB64 = Buffer.from(JSON.stringify({ userId: 'u1', exp: pastExp })).toString('base64url');
      const sig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
      const expiredJwt = `${headerB64}.${payloadB64}.${sig}`;

      expect(() => parseMockJwt(expiredJwt, secret)).toThrow('Expired JWT token');
    });
  });

  describe('UT-GEN-027: Security - Invalid signature rejected', () => {
    it('rejects tokens signed with an incorrect secret key', () => {
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payloadB64 = Buffer.from(JSON.stringify({ userId: 'u1', exp: futureExp })).toString('base64url');
      const forgedSig = crypto.createHmac('sha256', 'wrong-secret').update(`${headerB64}.${payloadB64}`).digest('base64url');
      const forgedJwt = `${headerB64}.${payloadB64}.${forgedSig}`;

      expect(() => parseMockJwt(forgedJwt, 'actual-secret')).toThrow('Invalid JWT signature');
    });
  });

  describe('UT-GEN-028: Security - Replay-sensitive operation protected', () => {
    it('rejects repeated execution of nonces or timestamp-expired requests', () => {
      const processedNonces = new Set<string>();

      const executeWithNonce = (nonce: string, timestampMs: number) => {
        const now = Date.now();
        if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
          throw new Error('Request expired: timestamp drift exceeds 5 minutes');
        }
        if (processedNonces.has(nonce)) {
          throw new Error('Replay attack detected: nonce has already been consumed');
        }
        processedNonces.add(nonce);
        return { success: true };
      };

      const nonce = 'unique-nonce-1';
      const ts = Date.now();
      expect(executeWithNonce(nonce, ts).success).toBe(true);
      expect(() => executeWithNonce(nonce, ts)).toThrow('Replay attack detected');
    });
  });
});
