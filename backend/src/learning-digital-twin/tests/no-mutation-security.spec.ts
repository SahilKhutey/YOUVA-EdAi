import { ForbiddenException } from '@nestjs/common';
import { SimulationPolicy } from '../policies/simulation-policy';

describe('NoMutationSecurityPolicy (LKC-15)', () => {
  let policy: SimulationPolicy;

  beforeEach(() => {
    policy = new SimulationPolicy();
  });

  describe('validateNoMutation', () => {
    it('should prohibit canonical mutations during simulation', () => {
      const prohibited = [
        'MUTATE_CANONICAL_KNOWLEDGE',
        'MUTATE_CANONICAL_MASTERY',
        'MUTATE_CANONICAL_CURRICULUM',
        'CREATE_REAL_ASSIGNMENT',
        'SEND_REAL_MESSAGE',
      ];

      for (const action of prohibited) {
        expect(() => policy.validateNoMutation(action)).toThrow(ForbiddenException);
        expect(() => policy.validateNoMutation(action)).toThrow(/No-Mutation Invariant Violation/);
      }
    });

    it('should allow legitimate simulation actions', () => {
      expect(() => policy.validateNoMutation('RUN_SIMULATION')).not.toThrow();
      expect(() => policy.validateNoMutation('READ_SNAPSHOT')).not.toThrow();
      expect(() => policy.validateNoMutation('CALCULATE_METRIC')).not.toThrow();
    });
  });

  describe('validateScopeAuthorization', () => {
    it('should forbid student role from accessing or executing simulations', () => {
      expect(() => policy.validateScopeAuthorization('STUDENT', 'CLASS')).toThrow(
        ForbiddenException,
      );
      expect(() => policy.validateScopeAuthorization('STUDENT', 'TENANT')).toThrow(
        ForbiddenException,
      );
    });

    it('should restrict teacher role to class and course scopes', () => {
      expect(() => policy.validateScopeAuthorization('TEACHER', 'CLASS')).not.toThrow();
      expect(() => policy.validateScopeAuthorization('TEACHER', 'COURSE')).not.toThrow();
      expect(() => policy.validateScopeAuthorization('TEACHER', 'TENANT')).toThrow(
        ForbiddenException,
      );
    });

    it('should permit admin role for all scopes', () => {
      expect(() => policy.validateScopeAuthorization('ADMIN', 'CLASS')).not.toThrow();
      expect(() => policy.validateScopeAuthorization('ADMIN', 'COURSE')).not.toThrow();
      expect(() => policy.validateScopeAuthorization('ADMIN', 'TENANT')).not.toThrow();
    });
  });
});
