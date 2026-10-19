# YOUVA EdAI — Phase 5: Evidence-Based Iteration & MVP Declaration
## Execution Steps and Fixes (built and tested on `phase5/governance`, on top of Phase 4)

**Where this sits:** Phases 0–4 contained the repo, built a small branch, made one session safe, put consent and supervision around it, and added pilot instrumentation. Phase 5 is what happens after the pilot: deciding what to build next, declaring the MVP, and making the discipline permanent. Four patches are in `phase5-patches/`; they apply on top of the Phase 4 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

**What I cannot do in this phase:** choose your next feature or declare the MVP. Both depend on what the pilot showed, and there is no pilot data yet. What I built is the set of guardrails that stop the problems found at the start of this engagement (invented evidence, inflated numbers, scope creep) from coming back.

---

## What I built

| Patch | Change |
|---|---|
| 0001 | **Whole-application boot test.** Builds the full dependency graph with a stubbed database. I checked it can fail: removing one provider made it fail with a clear message, and restoring it made it pass. It catches broken module wiring that hand-built unit tests miss. It does not start a server or touch a database. |
| 0002 | **Claims check + CI.** A script (`npm run check:claims`) rejects, in the README and docs: hardcoded test counts and "100% green/verified" badges (README only), and claims of sign-off, external review, or a completed pilot unless the same line cites an existing file as `[evidence: docs/evidence/<file>]`. Unchecked to-do items and lines marked `[planned]` are exempt. A new `verify` workflow runs type checks, the full backend test suite, the claims check, and the frontend type check and build on every pull request. (6 tests.) |
| 0003 | **Honest README**, `AGENTS.md` (rules for people and AI tools: work on a branch, no claim without a command, never invent real-world facts, never generate evidence), `docs/DECISIONS.md` (six decisions, each with its evidence), `docs/NEXT_BUILD.md` (a one-page form that forces a next feature to cite a real observation), `docs/MVP_EXIT_CRITERIA.md` (12 rows: 4 automated, 8 needing a person), and corrections to the pilot documents (below) |
| 0004 | Updates `docs/TRUTH_BASELINE.md` |

**Measured (sandbox):** backend TypeScript errors 0; 56 suites and 142 tests passing (up from 135), excluding `prisma.service.spec.ts`; frontend `tsc` 0 errors; claims check passes on 13 files. **Not verified:** the CI workflow has not run on GitHub; the frontend production build could not complete in my sandbox because Google Fonts is blocked there, so the first CI run will tell you; no real database; no real pilot data.

---

## What I found while building this
- **The old CI only ran one folder of tests** (`src/learning-loop`), only on `main` and `master`, so it said little about the product. The new `verify` workflow runs everything.
- **The old README was wrong in places:** it named Next.js 14 (the frontend uses 16), said the database was SQLite for development (the schema targets PostgreSQL only), and listed a broad feature set. The new one lists only what the code does and says what it does not.
- **The claims check caught my own sentence** while I was writing the README (a negated use of the word "verified"). That is the intended behaviour, and it shows the rule is strict.
- **My earlier scope note was wrong.** I had called forum, scheduling and credentials "not part of the MVP", but a static grep shows the existing UI calls them. They are "not needed by the pilot path", and `MVP_SCOPE.md` now says so. The same grep shows the UI does not call the teacher override, consent or learning-loop endpoints, so those have no screen yet. (The grep misses calls made with `fetch`, such as notifications and feedback.)
- **AI is still reachable outside the quiz path.** Quiz questions only come from an AI when `QUESTION_SOURCE=AI`, but the AI mentor and content-generation modules call Google Gemini when used and could send what a student types. I corrected `DATA_HANDLING.md` (which wrongly implied no student data goes to an AI provider) and added a line to the safety protocol telling the supervising adult to keep students on the practice page.

---

## Execution steps

### Step 5.1 — Apply the patches and switch on CI (you)
```bash
git checkout mvp/clean            # Phase 1–4 patches applied
git am phase5-patches/*.patch
cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e && npx ts-node scripts/check-claims.ts
```
Push, open a pull request, and watch the first `verify` run. Fix what fails; the frontend build is the most likely surprise. Then in GitHub branch protection, make `verify` a required check and require one review (CODEOWNERS already names you).

### Step 5.2 — Decide which branch is the product line (you)
`main` still holds the pre-retrack history. Suggested: in GitHub, rename `main` to `archive/main-pre-retrack` (Settings, Branches), then make the reviewed `mvp/clean` branch the new `main`, and keep all tags. This is your call; do it after the Phase 4 pilot succeeds, not before. Nothing needs to be deleted.

### Step 5.3 — Make the agent policy real (you)
If you use an AI coding tool, point it at `AGENTS.md` (for example, tell it to read that file first), give it its own account or token that cannot merge, and require pull requests. A rule only works if the tool cannot bypass it, which is why branch protection comes first. Reject any pull request that adds pilot reports, sign-offs, audit results or hand-typed test counts.

### Step 5.4 — Use `docs/NEXT_BUILD.md` for every feature decision (you)
After the pilot, fill one page per candidate change, each citing a real observation (a session note date, a report line, a teacher quote). If you cannot fill field 1 with something real, the answer is "not now". Record the decision in `docs/DECISIONS.md`.

### Step 5.5 — Bringing back a frozen module (you)
Before using anything outside `MVP_SCOPE.md`: write the `NEXT_BUILD.md` page; read the module's code; check it has real tests (not only "should be defined" scaffolds, and none that test helpers defined in the test file); confirm `tsc`, the full tests and the boot test pass with it enabled; and have the claims check pass. If it touches student data, add its tables to `backend/src/consent/erasure-map.ts` (a test fails until you do).

### Step 5.6 — Declare the MVP only against the criteria (you)
Go through `docs/MVP_EXIT_CRITERIA.md`. Rows 1–4 CI checks for you. Rows 5–12 need a person and evidence; do not tick one on anyone's word, including an AI tool's. "MVP" here means: real students used it, safely, with consent, and the teacher engaged. It does not mean it improves learning outcomes; a pilot this small cannot show that.

### Step 5.7 — Choose what comes after, one at a time (you)
Candidates from the original vision, with the question each must answer before it is worth building:

| Candidate | Only if the pilot showed… |
|---|---|
| Teacher override and consent screens | the API-only workflow was awkward for the teacher |
| More topics or another grade | students and teacher wanted more, and item-bank authoring was manageable |
| Images, audio or video | students or the teacher asked for visual or spoken explanations |
| Younger students | a separate safety review and pilot are planned; this needs new design, not a switch |
| Multiple schools, billing, integrations | schools are asking and will pay or commit |
| Wiring the richer learning-loop flow | the current loop's limits were the bottleneck |

### Step 5.8 — Keep the discipline going (you)
Monthly: rerun `scripts/truth-baseline.sh` and update `docs/TRUTH_BASELINE.md`; review who has write access; rotate secrets; check `erasure-map.ts` against any new tables; read `docs/DECISIONS.md` for entries that need superseding. Before any new school or year group, repeat the consent and safety steps from Phase 3 for them.

---

## Limits to keep in mind
- **The claims check is a pattern matcher.** It catches careless or generated claims in the places it scans; it cannot catch a determined author, a claim phrased differently, or a falsehood in a file it doesn't scan. It supports human review; it does not replace it.
- **The boot test uses a stubbed database,** so it proves wiring, not behaviour.
- **I wrote the README from reading the code.** Run the commands in it on a clean machine and fix anything that doesn't work; that is the real test of a README.
- **Nothing here shows the product works for students.** Only the pilot can begin to.

## Exit checklist
- [ ] Patches applied; `verify` passes on GitHub (including the frontend build); required checks and review enabled
- [ ] README commands work from a clean checkout
- [ ] `AGENTS.md` in force; any AI tool has its own account and cannot merge
- [ ] A `NEXT_BUILD.md` page exists for the first post-pilot change, citing real observations
- [ ] `docs/MVP_EXIT_CRITERIA.md` reviewed row by row; MVP declared only if every row is true
- [ ] Decisions recorded in `docs/DECISIONS.md`; monthly routine scheduled
