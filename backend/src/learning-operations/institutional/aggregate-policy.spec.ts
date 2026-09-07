import { canShowAggregate } from './institutional.types';

describe('canShowAggregate Privacy Gating', () => {
  it('allows sufficiently large cohorts', () => {
    expect(canShowAggregate(20, 10)).toBe(true);
    expect(canShowAggregate(10, 10)).toBe(true);
  });

  it('blocks tiny cohorts', () => {
    expect(canShowAggregate(4, 10)).toBe(false);
    expect(canShowAggregate(9, 10)).toBe(false);
  });

  it('uses default minimum threshold of 10 if not specified', () => {
    expect(canShowAggregate(15)).toBe(true);
    expect(canShowAggregate(5)).toBe(false);
  });
});
