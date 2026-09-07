import { LearningPolicyService } from './learning-policy.service';

describe('LearningPolicyService', () => {
  const service = new LearningPolicyService();

  it('requires human approval when configured', () => {
    const result = service.decide({
      actionType: 'CHANGE_CURRICULUM',
      ageTier: 'HIGH_SCHOOL',
      confidence: 0.99,
      reversible: false,
      requiresHumanApproval: true,
    });

    expect(result.decision).toBe('REQUIRE_APPROVAL');
    expect(result.autonomyLevel).toBe('HUMAN_REQUIRED');
  });

  it('blocks uncertain autonomous decisions (< 0.70 confidence)', () => {
    const result = service.decide({
      actionType: 'RECOMMEND_PRACTICE',
      ageTier: 'HIGH_SCHOOL',
      confidence: 0.40,
      reversible: true,
      requiresHumanApproval: false,
    });

    expect(result.decision).toBe('REQUIRE_APPROVAL');
    expect(result.autonomyLevel).toBe('ASSISTED');
  });

  it('requires human approval for non-reversible actions in KIDS age tier', () => {
    const result = service.decide({
      actionType: 'ACCELERATE_TOPIC',
      ageTier: 'KIDS',
      confidence: 0.95,
      reversible: false,
      requiresHumanApproval: false,
    });

    expect(result.decision).toBe('REQUIRE_APPROVAL');
    expect(result.autonomyLevel).toBe('HUMAN_REQUIRED');
  });

  it('allows sufficiently confident reversible actions', () => {
    const result = service.decide({
      actionType: 'CHANGE_DIFFICULTY',
      ageTier: 'HIGH_SCHOOL',
      confidence: 0.90,
      reversible: true,
      requiresHumanApproval: false,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.autonomyLevel).toBe('AUTO_REVERSIBLE');
  });
});
