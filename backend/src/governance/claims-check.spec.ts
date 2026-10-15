import { checkText } from './claims-check';

const none = () => false;
const has = (p: string) => p === 'docs/evidence/review.pdf';

describe('claims check', () => {
  it('flags hardcoded test counts and green badges in a README, but not in other docs', () => {
    const text = '| TOTAL | 7,971 / 7,971 tests | 100% GREEN |\nWe run 135 tests locally.';
    const readme = checkText('README.md', text, none).map((v) => v.rule);
    expect(readme).toContain('hardcoded-test-count');
    expect(readme).toContain('green-badge-claim');
    expect(checkText('docs/TRUTH_BASELINE.md', 'Unit tests | 135 passed', none)).toEqual([]);
  });

  it('flags the word "verified" in a README', () => {
    expect(checkText('README.md', 'All modules are Verified.', none).map((v) => v.rule)).toEqual(['verified-label']);
    expect(checkText('README.md', 'Run `npx tsc --noEmit` to check types.', none)).toEqual([]);
  });

  it('flags external-review and sign-off claims unless the line cites an evidence file that exists', () => {
    expect(checkText('docs/x.md', 'The design was approved by the school board.', none)).toHaveLength(1);
    expect(checkText('docs/x.md', 'Independent security review completed.', none)[0].rule).toBe('external-review-claim');
    expect(checkText('docs/x.md', 'Independent security review completed. [evidence: docs/evidence/review.pdf]', has)).toEqual([]);
    expect(checkText('docs/x.md', 'Independent security review completed. [evidence: docs/evidence/nope.pdf]', has)[0].rule).toBe('external-review-claim:evidence-file-missing');
  });

  it('flags a claim that a pilot was completed or evaluated', () => {
    expect(checkText('docs/x.md', 'The pilot was successfully completed at the school.', none)).toHaveLength(1);
    expect(checkText('docs/x.md', 'Pilot evaluation was conducted and evaluated by an external body.', none)).toHaveLength(1);
  });

  it('does not flag plans or templates that merely mention these words', () => {
    expect(checkText('docs/pilot/RUNBOOK.md', '- [ ] Write the pilot report from real numbers', none)).toEqual([]);
    expect(checkText('docs/pilot/CONSENT_FORM.md', 'Have a lawyer review this before use.', none)).toEqual([]);
    expect(checkText('docs/x.md', '- [ ] Reviewed and signed off by the teacher', none)).toEqual([]); // unchecked task
    expect(checkText('docs/x.md', 'We will get an independent review before the pilot. [planned]', none)).toEqual([]);
    expect(checkText('docs/x.md', 'We will get an independent review before the pilot.', none)).toHaveLength(1); // unmarked: must be marked [planned]
    expect(checkText('docs/x.md', '- [x] Reviewed and signed off by the teacher', none)).toHaveLength(1); // checked task is a claim
  });

  it('reports line numbers', () => {
    const v = checkText('README.md', 'ok\n\n100% green', none);
    expect(v[0]).toMatchObject({ line: 3, rule: 'green-badge-claim' });
  });
});
