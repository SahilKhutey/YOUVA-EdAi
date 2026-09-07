import { canRelease } from './release.service';

describe('canRelease', () => {
  const valid = {
    unitTestsPassed: true,
    integrationTestsPassed: true,
    securityTestsPassed: true,
    safetyTestsPassed: true,
    regressionTestsPassed: true,
    performancePassed: true,
  };

  it('allows a fully validated release', () => {
    expect(canRelease(valid)).toBe(true);
  });

  it('rejects safety failure', () => {
    expect(
      canRelease({
        ...valid,
        safetyTestsPassed: false,
      }),
    ).toBe(false);
  });

  it('rejects security failure', () => {
    expect(
      canRelease({
        ...valid,
        securityTestsPassed: false,
      }),
    ).toBe(false);
  });
});
