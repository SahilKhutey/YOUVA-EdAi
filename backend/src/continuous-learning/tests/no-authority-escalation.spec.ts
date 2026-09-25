import { ForbiddenException } from '@nestjs/common';
import { EvolutionPolicyService } from '../policies/evolution-policy.service';

describe('NoAuthorityEscalationPolicy (LKC-16)', () => {
  let policyService: EvolutionPolicyService;

  beforeEach(() => {
    policyService = new EvolutionPolicyService();
  });

  it('should enforce Self-Learning ≠ Self-Authorization invariant for unapproved changes', () => {
    // Level 3 (Educational) without approval must throw ForbiddenException
    expect(() =>
      policyService.validateNoAuthorityEscalation('MUTATE_CURRICULUM', 3, false, 'TEACHER'),
    ).toThrow(ForbiddenException);

    expect(() =>
      policyService.validateNoAuthorityEscalation('MUTATE_CURRICULUM', 3, false, 'TEACHER'),
    ).toThrow(/Self-Learning ≠ Self-Authorization Invariant Violation/);
  });

  it('should strictly prohibit student role from administering evolutions', () => {
    expect(() =>
      policyService.validateNoAuthorityEscalation('APPROVE_CANDIDATE', 2, true, 'STUDENT'),
    ).toThrow(ForbiddenException);

    expect(() =>
      policyService.validateNoAuthorityEscalation('APPROVE_CANDIDATE', 2, true, 'STUDENT'),
    ).toThrow(/Students cannot configure, approve, or execute/);
  });

  it('should require Administrator authorization for Level 4 High-Impact evolutions', () => {
    // Teacher attempting to authorize Level 4 must fail
    expect(() =>
      policyService.validateNoAuthorityEscalation('APPROVE_CANDIDATE', 4, true, 'TEACHER'),
    ).toThrow(ForbiddenException);

    expect(() =>
      policyService.validateNoAuthorityEscalation('APPROVE_CANDIDATE', 4, true, 'TEACHER'),
    ).toThrow(/Level 4 High-impact ecosystem changes require Administrator authorization/);

    // Admin authorizing Level 4 succeeds
    expect(() =>
      policyService.validateNoAuthorityEscalation('APPROVE_CANDIDATE', 4, true, 'ADMIN'),
    ).not.toThrow();
  });

  it('should return correct policy flags based on Evolution Level', () => {
    const level0 = policyService.getPolicy(0, 'CACHE');
    expect(level0.canAutoExecute).toBe(true);
    expect(level0.simulationRequired).toBe(false);

    const level1 = policyService.getPolicy(1, 'QUEUE_TUNING');
    expect(level1.canAutoExecute).toBe(true);
    expect(level1.rollbackRequired).toBe(true);

    const level3 = policyService.getPolicy(3, 'KNOWLEDGE_OBJECT');
    expect(level3.canAutoExecute).toBe(false);
    expect(level3.simulationRequired).toBe(true);
    expect(level3.approvalRequired).toBe(true);
  });
});
