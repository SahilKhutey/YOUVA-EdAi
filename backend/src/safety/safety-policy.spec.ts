import { SafetyPolicyService, SafetyDecision, SafetySeverity } from './safety-policy.service';

describe('P3 SafetyPolicyService', () => {
  let service: SafetyPolicyService;

  beforeEach(() => {
    service = new SafetyPolicyService();
  });

  describe('Deterministic Safety Evaluation Gate', () => {
    it('✓ continues low-risk learning interactions', () => {
      const decision = service.evaluate({
        category: 'GENERAL_DISTRESS',
        confidence: 0.3,
      });
      expect(decision).toBe(SafetyDecision.CONTINUE);
    });

    it('✓ requires teacher review for medium/high-risk signals', () => {
      const decision = service.evaluate({
        category: 'DISTRESS',
        confidence: 0.85,
        severity: SafetySeverity.MEDIUM,
      });
      expect(decision).toBe(SafetyDecision.TEACHER_REVIEW);
    });

    it('✓ escalates critical safety categories regardless of low confidence', () => {
      const decision = service.evaluate({
        category: 'SELF_HARM_IDEATION',
        confidence: 0.45,
      });
      expect(decision).toBe(SafetyDecision.ESCALATE);
    });

    it('✓ escalates high-risk categories when confidence exceeds threshold (>= 0.7)', () => {
      const decision = service.evaluate({
        category: 'BULLYING_HARASSMENT',
        confidence: 0.92,
      });
      expect(decision).toBe(SafetyDecision.ESCALATE);
    });

    it('✓ routes high-risk category with moderate confidence to TEACHER_REVIEW', () => {
      const decision = service.evaluate({
        category: 'BULLYING',
        confidence: 0.65,
      });
      expect(decision).toBe(SafetyDecision.TEACHER_REVIEW);
    });
  });
});
