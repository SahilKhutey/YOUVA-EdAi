import { transitionIntervention } from './intervention.types';

describe('transitionIntervention State Machine', () => {
  it('allows proposal approval', () => {
    expect(
      transitionIntervention(
        'PROPOSED',
        'APPROVED',
      ),
    ).toBe('APPROVED');
  });

  it('allows proposal rejection', () => {
    expect(
      transitionIntervention(
        'PROPOSED',
        'REJECTED',
      ),
    ).toBe('REJECTED');
  });

  it('allows full progression: APPROVED -> SCHEDULED -> IN_PROGRESS -> EVALUATING -> SUCCESS', () => {
    expect(transitionIntervention('APPROVED', 'SCHEDULED')).toBe('SCHEDULED');
    expect(transitionIntervention('SCHEDULED', 'IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(transitionIntervention('IN_PROGRESS', 'EVALUATING')).toBe('EVALUATING');
    expect(transitionIntervention('EVALUATING', 'SUCCESS')).toBe('SUCCESS');
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      transitionIntervention(
        'PROPOSED',
        'SUCCESS',
      ),
    ).toThrow('Invalid intervention transition: PROPOSED -> SUCCESS');
  });
});
