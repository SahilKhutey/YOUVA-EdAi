import { AutonomyPolicy } from '../policies/autonomy-policy';
import { ScopePolicy } from '../policies/scope-policy';

describe('Policy Evaluation (LKC-13)', () => {
  describe('AutonomyPolicy', () => {
    let policy: AutonomyPolicy;

    beforeEach(() => {
      policy = new AutonomyPolicy();
    });

    it('should evaluate OBSERVE (level 0) correctly', () => {
      const result = policy.evaluate('OBSERVE');
      expect(result.allowed).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('OBSERVE');
      expect(result.requiresHumanApproval).toBe(false);
    });

    it('should evaluate RECOMMEND (level 1) requiring human approval', () => {
      const result = policy.evaluate('RECOMMEND');
      expect(result.allowed).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('RECOMMEND');
      expect(result.requiresHumanApproval).toBe(true);
    });

    it('should evaluate SAFE_EXECUTE (level 2) permitting auto execution for non-sensitive actions', () => {
      const result = policy.evaluate('SAFE_EXECUTE', false);
      expect(result.allowed).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('SAFE_EXECUTE');
      expect(result.requiresHumanApproval).toBe(false);
    });

    it('should downgrade SAFE_EXECUTE to require approval when action is marked sensitive', () => {
      const result = policy.evaluate('SAFE_EXECUTE', true);
      expect(result.allowed).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('RECOMMEND');
      expect(result.requiresHumanApproval).toBe(true);
    });

    it('should evaluate GOVERNED_ADAPTIVE (level 3) permitting automated ecosystem orchestration', () => {
      const result = policy.evaluate('GOVERNED_ADAPTIVE', false);
      expect(result.allowed).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('GOVERNED_ADAPTIVE');
      expect(result.requiresHumanApproval).toBe(false);
    });

    it('should enforce the Emergency Kill Switch by halting automated executions', () => {
      // Toggle kill switch on (automation disabled)
      policy.setAutomationEnabled(false, 'Test Admin');
      expect(policy.isAutomationEnabled()).toBe(false);

      const result = policy.evaluate('GOVERNED_ADAPTIVE');
      expect(result.killSwitchActive).toBe(true);
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.effectiveAutonomyLevel).toBe('RECOMMEND');
    });
  });

  describe('ScopePolicy', () => {
    let policy: ScopePolicy;

    beforeEach(() => {
      policy = new ScopePolicy();
    });

    it('should allow same-scope and lower-scope executions', () => {
      const sameScope = policy.validateScope('LEARNER', 'LEARNER');
      expect(sameScope.allowed).toBe(true);

      const lowerScope = policy.validateScope('CLASS', 'LEARNER');
      expect(lowerScope.allowed).toBe(true);
    });

    it('should deny and block scope escalation (LEARNER attempting CLASS or TENANT mutation)', () => {
      const escalation1 = policy.validateScope('LEARNER', 'CLASS');
      expect(escalation1.allowed).toBe(false);
      expect(escalation1.reason).toContain('Scope Escalation Violation');

      const escalation2 = policy.validateScope('LEARNER', 'TENANT');
      expect(escalation2.allowed).toBe(false);
      expect(escalation2.reason).toContain('Scope Escalation Violation');
    });

    it('should enforce tenant isolation', () => {
      const allowed = policy.validateTenant('tenant-a', 'tenant-a');
      expect(allowed.allowed).toBe(true);

      const denied = policy.validateTenant('tenant-a', 'tenant-b');
      expect(denied.allowed).toBe(false);
      expect(denied.reason).toContain('Tenant Isolation Violation');
    });
  });
});
