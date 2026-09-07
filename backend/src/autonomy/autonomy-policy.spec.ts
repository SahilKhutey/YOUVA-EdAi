import { AutonomyPolicyService } from './autonomy-policy.service';
import { AgentAction, AgeTier, RiskClassification } from './autonomy.types';

describe('AutonomyPolicyService', () => {
  let service: AutonomyPolicyService;

  beforeEach(() => {
    service = new AutonomyPolicyService();
  });

  describe('Human Authority & Safety Invariants', () => {
    it.each([
      AgentAction.MODIFY_MASTERY,
      AgentAction.MODIFY_CONSENT,
      AgentAction.MODIFY_ROLE,
      AgentAction.CLOSE_SAFETY_CASE,
      AgentAction.DELETE_LEARNER,
      AgentAction.CHANGE_BILLING,
    ])('strictly blocks %s from autonomous execution', (action) => {
      const decision = service.evaluatePolicy({
        agentKey: 'pedagogical-tutor',
        action,
        payload: { learnerId: 'learner-1' },
      });

      expect(decision.allowed).toBe(false);
      expect(decision.riskLevel).toBe(RiskClassification.BLOCKED);
      expect(decision.requiresApproval).toBe(false);
      expect(decision.reason).toContain('strictly prohibited');
    });
  });

  describe('Curricular and Content Assignments', () => {
    it('requires human approval for ASSIGN_CONTENT', () => {
      const decision = service.evaluatePolicy({
        agentKey: 'curriculum-agent',
        action: AgentAction.ASSIGN_CONTENT,
        payload: { contentId: 'module-42', learnerId: 'learner-1' },
      });

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(true);
      expect(decision.riskLevel).toBe(RiskClassification.HUMAN_APPROVAL);
      expect(decision.reason).toContain('Curricular content assignments require teacher review');
    });
  });

  describe('Age-Tiered Rescheduling', () => {
    it('requires human approval to reschedule activity for child learners (KIDS)', () => {
      const decision = service.evaluatePolicy({
        agentKey: 'scheduler-agent',
        action: AgentAction.RESCHEDULE_ACTIVITY,
        ageTier: AgeTier.KIDS,
        payload: { activityId: 'act-1', requestedTime: '2026-09-10T10:00:00Z' },
      });

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(true);
      expect(decision.riskLevel).toBe(RiskClassification.HUMAN_APPROVAL);
      expect(decision.reason).toContain('child learners require parent/teacher approval');
    });

    it('permits autonomous rescheduling for teen learners', () => {
      const decision = service.evaluatePolicy({
        agentKey: 'scheduler-agent',
        action: AgentAction.RESCHEDULE_ACTIVITY,
        ageTier: AgeTier.TEEN,
        payload: { activityId: 'act-1' },
      });

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(false);
      expect(decision.riskLevel).toBe(RiskClassification.AUTO_LOW_RISK);
    });

    it('permits autonomous rescheduling for adult learners', () => {
      const decision = service.evaluatePolicy({
        agentKey: 'scheduler-agent',
        action: AgentAction.RESCHEDULE_ACTIVITY,
        ageTier: AgeTier.ADULT,
        payload: { activityId: 'act-1' },
      });

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(false);
      expect(decision.riskLevel).toBe(RiskClassification.AUTO_LOW_RISK);
    });
  });

  describe('Bounded Pedagogical Assistance', () => {
    it.each([
      AgentAction.RECOMMEND_ACTIVITY,
      AgentAction.GENERATE_HINT,
      AgentAction.GENERATE_EXPLANATION,
    ])('approves autonomous execution for low-risk action %s', (action) => {
      const decision = service.evaluatePolicy({
        agentKey: 'tutor-agent',
        action,
        payload: { conceptId: 'fractions-101' },
      });

      expect(decision.allowed).toBe(true);
      expect(decision.requiresApproval).toBe(false);
      expect(decision.riskLevel).toBe(RiskClassification.AUTO_LOW_RISK);
    });
  });

  describe('Deterministic Hashing', () => {
    it('produces identical sha256 hash for matching JSON payloads regardless of key order', () => {
      const hashA = service.calculateHash({ a: 1, b: 2 });
      const hashB = service.calculateHash({ b: 2, a: 1 });
      expect(hashA).toBe(hashB);
    });
  });
});
