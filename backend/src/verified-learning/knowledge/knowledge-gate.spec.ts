import { canEnterGlobalKnowledge } from './knowledge.service';

describe('Global Knowledge Gate & Anti-Poisoning Protection', () => {
  const valid = {
    privacyApproved: true,
    safetyApproved: true,
    evidenceQuality: 0.9,
    replicated: true,
    expertReviewed: true,
  };

  it('allows validated knowledge when all gates pass', () => {
    expect(canEnterGlobalKnowledge(valid)).toBe(true);
  });

  it('blocks privacy failure', () => {
    expect(
      canEnterGlobalKnowledge({
        ...valid,
        privacyApproved: false,
      }),
    ).toBe(false);
  });

  it('blocks unreplicated findings from becoming global knowledge', () => {
    expect(
      canEnterGlobalKnowledge({
        ...valid,
        replicated: false,
      }),
    ).toBe(false);
  });

  it('blocks low evidence quality (< 0.8)', () => {
    expect(
      canEnterGlobalKnowledge({
        ...valid,
        evidenceQuality: 0.75,
      }),
    ).toBe(false);
  });

  it('blocks findings lacking expert/teacher review', () => {
    expect(
      canEnterGlobalKnowledge({
        ...valid,
        expertReviewed: false,
      }),
    ).toBe(false);
  });
});
