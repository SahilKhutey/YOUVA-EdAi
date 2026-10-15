/**
 * Flags statements that look like verified facts but cannot be checked: hardcoded test counts,
 * "100% green/verified" badges, and claims of external review, sign-off, or a completed pilot.
 * A claim about an external event is allowed only if the same line points at a real evidence file:
 *   "Security review completed 2026-11-03 [evidence: docs/evidence/security-review.pdf]"
 */
export interface Violation { file: string; line: number; rule: string; text: string }

const EVIDENCE = /\[evidence:\s*([^\]\s]+)\s*\]/i;

const README_RULES: { rule: string; re: RegExp; why: string }[] = [
  { rule: 'hardcoded-test-count', re: /\b\d[\d,]*\s*(\/\s*[\d,]+\s*)?(automated\s+|unit\s+|e2e\s+)?tests?\b/i, why: 'test counts belong only in docs/TRUTH_BASELINE.md, generated from a real run' },
  { rule: 'green-badge-claim', re: /100\s*%\s*(green|verified|pass(ing|ed)?)/i, why: 'percentage badges cannot be checked' },
  { rule: 'verified-label', re: /\bverified\b/i, why: '"verified" needs an evidence link; describe what was run instead' },
];

const CLAIM_RULES: { rule: string; re: RegExp }[] = [
  { rule: 'external-review-claim', re: /\b(signed[- ]?off|approved by|independent(ly)?[- ](security[- ]|safety[- ])?(review|audit|evaluat\w*)|externally[- ](reviewed|audited)|third[- ]party (review|audit))\b/i },
  { rule: 'pilot-completed-claim', re: /\bpilot\b.{0,40}\b(was|has been|were|completed|conducted|ran|run)\b.{0,40}\b(completed|conducted|successful|successfully|evaluated)\b/i },
];

/** Pure check of one file's text. `exists` tells whether a repo-relative path exists. */
export function checkText(file: string, text: string, exists: (path: string) => boolean): Violation[] {
  const out: Violation[] = [];
  const isReadme = /(^|\/)README\.md$/i.test(file);
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    // Unchecked to-do items and lines marked [planned] describe intentions, not facts.
    const isPlan = /^[-*]\s*\[ \]/.test(line) || /\[planned\]/i.test(line);
    if (isReadme) {
      for (const r of README_RULES) if (r.re.test(line)) out.push({ file, line: i + 1, rule: r.rule, text: line.slice(0, 160) });
    }
    for (const r of CLAIM_RULES) {
      if (isPlan || !r.re.test(line)) continue;
      const ev = line.match(EVIDENCE);
      if (ev && exists(ev[1])) continue;
      out.push({ file, line: i + 1, rule: ev ? `${r.rule}:evidence-file-missing` : r.rule, text: line.slice(0, 160) });
    }
  });
  return out;
}
