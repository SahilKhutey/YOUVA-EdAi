import { canStartExperiment } from './improvement.service';

describe('canStartExperiment', () => {
  it('requires safety review', () => {
    expect(
      canStartExperiment({
        riskLevel: 'LOW',
        safetyReviewed: false,
        teacherReviewed: true,
        privacyReviewed: true,
      }),
    ).toBe(false);
  });

  it('requires privacy review', () => {
    expect(
      canStartExperiment({
        riskLevel: 'LOW',
        safetyReviewed: true,
        teacherReviewed: true,
        privacyReviewed: false,
      }),
    ).toBe(false);
  });

  it('requires teacher review for higher risk', () => {
    expect(
      canStartExperiment({
        riskLevel: 'HIGH',
        safetyReviewed: true,
        teacherReviewed: false,
        privacyReviewed: true,
      }),
    ).toBe(false);
  });

  it('allows fully reviewed low-risk experiments', () => {
    expect(
      canStartExperiment({
        riskLevel: 'LOW',
        safetyReviewed: true,
        teacherReviewed: false,
        privacyReviewed: true,
      }),
    ).toBe(true);
  });
});
