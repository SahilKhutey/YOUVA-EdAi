import { detectRegression } from './improvement.service';

describe('detectRegression', () => {
  it('detects significant change', () => {
    expect(
      detectRegression(
        0.8,
        0.6,
        0.2,
      ),
    ).toBe(true);
  });

  it('ignores small changes', () => {
    expect(
      detectRegression(
        0.8,
        0.79,
        0.2,
      ),
    ).toBe(false);
  });

  it('handles zero baseline', () => {
    expect(
      detectRegression(0, 0, 0.2),
    ).toBe(false);

    expect(
      detectRegression(0, 1, 0.2),
    ).toBe(true);
  });
});
