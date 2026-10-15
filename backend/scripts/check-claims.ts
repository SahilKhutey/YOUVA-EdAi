/** Usage (from backend/): npx ts-node scripts/check-claims.ts   Exits 1 if any unverifiable claim is found. */
import * as fs from 'fs';
import * as path from 'path';
import { checkText, Violation } from '../src/governance/claims-check';

const root = path.resolve(__dirname, '../..');
const SKIP = [/^docs\/evidence\//, /^quarantine\//, /^node_modules\//, /\/node_modules\//, /^\.git\//];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (SKIP.some((s) => s.test(rel + (e.isDirectory() ? '/' : '')))) continue;
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

const files = walk(root).filter((f) => f === 'README.md' || f.startsWith('docs/') || f === 'MVP_SCOPE.md' || f === 'AGENTS.md');
const exists = (p: string) => fs.existsSync(path.join(root, p));
const violations: Violation[] = files.flatMap((f) => checkText(f, fs.readFileSync(path.join(root, f), 'utf8'), exists));

if (violations.length) {
  console.error(`Found ${violations.length} unverifiable claim(s):`);
  for (const v of violations) console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.text}`);
  console.error('\nFix: remove the claim, describe what was actually run, or add [evidence: <path to a real file>] on the same line.');
  process.exit(1);
}
console.log(`Claims check passed (${files.length} files scanned).`);
