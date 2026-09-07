import { getMultimodalPolicy } from './multimodal.policy';

describe('Multimodal Policy & Age Tiers', () => {
  it('restricts KIDS policy (no video, requires teacher review)', () => {
    const policy = getMultimodalPolicy('KIDS');

    expect(policy.allowVideo).toBe(false);
    expect(policy.requiresTeacherReview).toBe(true);
    expect(policy.maxInputBytes).toBe(5_000_000);
    expect(policy.maxDurationSeconds).toBe(60);
  });

  it('supports broader high-school and adult modality', () => {
    const policy = getMultimodalPolicy('HIGH_SCHOOL');

    expect(policy.allowImage).toBe(true);
    expect(policy.allowAudio).toBe(true);
    expect(policy.allowVideo).toBe(true);
    expect(policy.requiresTeacherReview).toBe(false);
    expect(policy.maxDurationSeconds).toBe(300);
  });

  it('rejects unknown age tier', () => {
    expect(() => getMultimodalPolicy('UNKNOWN')).toThrow('Unsupported age tier.');
  });
});
