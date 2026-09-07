import * as crypto from 'crypto';

describe('General Unit Tests: Audit Logging & Immutability (UT-GEN-071 - UT-GEN-074)', () => {
  interface AuditEvent {
    id: string;
    action: string;
    actorUserId: string;
    tenantId: string;
    timestamp: string;
    details: Record<string, any>;
    signature: string;
  }

  class AuditService {
    private logs: AuditEvent[] = [];
    private readonly auditSecret = 'youva-tamper-evident-audit-secret-2026';

    private signEvent(payloadWithoutSig: Omit<AuditEvent, 'signature'>): string {
      return crypto
        .createHmac('sha256', this.auditSecret)
        .update(JSON.stringify(payloadWithoutSig))
        .digest('hex');
    }

    record(action: string, actorUserId: string, tenantId: string, details: Record<string, any>): AuditEvent {
      if (!actorUserId || !tenantId) {
        throw new Error('AuditValidationError: Actor ID and Tenant ID are strictly required');
      }

      const unsigned: Omit<AuditEvent, 'signature'> = {
        id: crypto.randomUUID(),
        action,
        actorUserId,
        tenantId,
        timestamp: new Date().toISOString(),
        details,
      };

      const signature = this.signEvent(unsigned);
      const event: AuditEvent = { ...unsigned, signature };
      this.logs.push(Object.freeze(event));
      return event;
    }

    verifyIntegrity(event: AuditEvent): boolean {
      const { signature, ...rest } = event;
      const expectedSig = this.signEvent(rest);
      return signature === expectedSig;
    }
  }

  describe('UT-GEN-071: Audit - Privileged action creates audit event', () => {
    it('creates immutable log record when privileged action is performed', () => {
      const audit = new AuditService();
      const event = audit.record('ROLE_MODIFIED', 'admin-1', 'tenant-alpha', { targetUser: 'u-10', newRole: 'TEACHER' });

      expect(event.action).toBe('ROLE_MODIFIED');
      expect(event.id).toBeDefined();
    });
  });

  describe('UT-GEN-072: Audit - Actor identity recorded', () => {
    it('records actor user ID and throws if actor identity is omitted', () => {
      const audit = new AuditService();
      const event = audit.record('STUDENT_CONSENT_GRANTED', 'parent-123', 'tenant-beta', {});

      expect(event.actorUserId).toBe('parent-123');
      expect(() => audit.record('ACTION', '', 'tenant-beta', {})).toThrow('Actor ID');
    });
  });

  describe('UT-GEN-073: Audit - Tenant identity recorded', () => {
    it('records tenant identity and rejects un-scoped audit records', () => {
      const audit = new AuditService();
      const event = audit.record('INTEGRATION_DISABLED', 'teacher-1', 'tenant-school-9', {});

      expect(event.tenantId).toBe('tenant-school-9');
      expect(() => audit.record('ACTION', 'user-1', '', {})).toThrow('Tenant ID');
    });
  });

  describe('UT-GEN-074: Audit - Audit event cannot be silently modified', () => {
    it('detects tampering or modifications via cryptographic signature check', () => {
      const audit = new AuditService();
      const event = audit.record('GRADE_OVERRIDDEN', 'teacher-1', 'tenant-1', { original: 70, overridden: 95 });

      // Valid check
      expect(audit.verifyIntegrity(event)).toBe(true);

      // Malicious tamper attempt
      const tamperedEvent: AuditEvent = {
        ...event,
        details: { original: 70, overridden: 100 }, // modified!
      };

      expect(audit.verifyIntegrity(tamperedEvent)).toBe(false);
    });
  });
});
