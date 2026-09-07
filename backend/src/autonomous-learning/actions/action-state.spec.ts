import { transitionAction } from './action-state';

describe('transitionAction State Machine', () => {
  it('accepts valid transitions', () => {
    expect(
      transitionAction(
        'APPROVED',
        'EXECUTING',
      ),
    ).toBe('EXECUTING');
  });

  it('allows full progression: PROPOSED -> POLICY_REVIEW -> APPROVED -> EXECUTING -> COMPLETED -> EVALUATING -> SUCCESS', () => {
    expect(transitionAction('PROPOSED', 'POLICY_REVIEW')).toBe('POLICY_REVIEW');
    expect(transitionAction('POLICY_REVIEW', 'APPROVED')).toBe('APPROVED');
    expect(transitionAction('APPROVED', 'EXECUTING')).toBe('EXECUTING');
    expect(transitionAction('EXECUTING', 'COMPLETED')).toBe('COMPLETED');
    expect(transitionAction('COMPLETED', 'EVALUATING')).toBe('EVALUATING');
    expect(transitionAction('EVALUATING', 'SUCCESS')).toBe('SUCCESS');
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      transitionAction(
        'PROPOSED',
        'COMPLETED',
      ),
    ).toThrow('Invalid action transition: PROPOSED -> COMPLETED');
  });

  it('allows rollback from EVALUATING to ROLLED_BACK', () => {
    expect(transitionAction('EVALUATING', 'ROLLED_BACK')).toBe('ROLLED_BACK');
  });
});
