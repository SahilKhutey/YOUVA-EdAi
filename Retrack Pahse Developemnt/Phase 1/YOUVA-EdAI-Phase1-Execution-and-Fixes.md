# YOUVA EdAI — Phase 1: Triage & Clean MVP Branch
## Execution Steps and Fixes (built and tested on `mvp/clean`)

**Where this sits:** Phase 0 was containment (access, evidence, quarantine, truth baseline). Phase 1 creates the small, honest codebase the MVP gets built on. Five patches are in `phase1-patches/`, made on a branch cut from commit `2b7d6d1` (Sep 5, "learning loop engine ... teacher operations module"). I cannot push to your repo, so you apply them yourself.

---

## What was measured, before and after

| Measure | `main` today | `2b7d6d1` as found | `mvp/clean` after patches |
|---|---|---|---|
| Tracked files | 1,425 | 375 | 381 |
| Backend TypeScript errors | 0 | **29** | **0** |
| Unit tests | 835 run, 20 failing | 15 suites failing | **94 passed, 0 failed (47 suites)** |
| Schema models / migrations | 196 / 1 | 53 / 4 | 53 / 4 |

Caveats on these numbers: they come from my sandbox, which has Prisma's generated types but no query engine, so I excluded `prisma.service.spec.ts` (it needs a database engine) and did not run e2e tests (they need Postgres and Redis). Re-run `scripts/truth-baseline.sh` on your machine and replace the figures in `docs/TRUTH_BASELINE.md` with yours.

---

## What I found in the base commit

1. **The base did not compile.** `2b7d6d1` had 29 type errors, 21 of them in `student-360.service.ts`. The code read database fields that don't exist: `StudyGoal.status`, `title`, `targetScore` and `UserStats.streakDays`. The schema has `isActive`, `weeklyXpTarget` and `currentStreak`. One wrong field in a Prisma `include` made TypeScript drop the whole relation typing, which produced the cascade of "property does not exist" errors.
2. **15 scaffold specs failed**, plus 3 more once those were fixed. All were auto-generated "should be defined" tests that never provided their dependencies.
3. **The core adaptive math had no real tests.** `BktService` and `RlDifficultyService` had only a "should be defined" scaffold each.
4. **`BktService` is not Bayesian Knowledge Tracing.** It is a heuristic: a correct answer adds 20% of the gap to 1.0, an incorrect one removes 30% of current mastery, clamped to [0.01, 0.99]. `P_SLIP` and `P_GUESS` are defined but never used. That is acceptable for an MVP and easy for a teacher to understand, but it should not be described as BKT in anything user-facing.
5. **`backend/prisma/dev.db` was tracked** in git (it holds test-user rows).

---

## The five patches

| Patch | Change |
|---|---|
| 0001 | Use the real schema fields in 4 files; backend typechecks with 0 errors |
| 0002 | Auto-mock missing providers in 18 scaffold specs so they run |
| 0003 | Add 9 behavioral tests for mastery and difficulty math (values hand-derived, then confirmed against the code) |
| 0004 | Untrack `dev.db`; add `CODEOWNERS`, PR template, `scripts/truth-baseline.sh`, `MVP_SCOPE.md`, `docs/TRUTH_BASELINE.md` |
| 0005 | Correct the baseline doc to the measured figures |

---

## Execution steps

### Step 1.1 — Create the branch and apply the patches
```bash
git fetch --all
git checkout -b mvp/clean 2b7d6d1
git am phase1-patches/*.patch
```
If you already merged the Phase 0 patches into `main`, that's fine; `mvp/clean` branches from an older commit and carries its own copies of the governance files.

### Step 1.2 — Verify on your machine (do not trust my numbers)
```bash
cd backend
npm ci
npx prisma generate
npx tsc --noEmit          # expect 0 errors
npx jest --testPathIgnorePatterns=e2e   # expect all passing
```
Record the results by running `../scripts/truth-baseline.sh | tee ../docs/TRUTH_BASELINE_RUN.txt`.

### Step 1.3 — Check the database layer (what I could not test)
1. Start Postgres locally. Set `DATABASE_URL`.
2. `npx prisma migrate deploy`, then `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <shadow-db-url>`. An empty diff means migrations match the schema; a non-empty diff means you need a new migration before anything relies on it.
3. Run `npx prisma db seed` and confirm questions and topics load.
4. Run the e2e suite: `npm run test:e2e`. Note which tests need Redis.

### Step 1.4 — Review what to keep, module by module
Open each folder and answer one question: does the MVP use it? `MVP_SCOPE.md` lists my starting classification:
- **Keep:** learning-engine, practice, assessment, learning-loop, teacher-ops, auth, users, subjects, prisma.
- **Present but outside the MVP (don't extend):** credential-mesh, edge-sync, agei, content-intelligence, forum, scheduler, multimodal and voice features.

Don't delete anything yet. Mark it, and delete only after Phase 2 confirms it is unused. Note that `app.module.ts` registers credential-mesh, edge-sync, content-intelligence, forum and scheduler (I checked; `agei` is not registered there), so the app boots them; consider unregistering the out-of-scope ones once you've read them.

### Step 1.5 — Decide about the Feb–Mar classroom MVP
Commit `75bda5d` ("1-on-1 Digital Classroom MVP with AI generation, Whiteboard & Feedback") and the voice-tutor frontend (`e9033ba`) sit before `2b7d6d1` in history, so they're already in this branch's ancestry. Open the frontend and decide whether that classroom UI is the student screen for the MVP or whether you build a simpler one.

### Step 1.6 — Merge via pull request
Push `mvp/clean`, open a PR into a new long-lived `mvp` branch (not into `main`), review the diff yourself, then merge. Protect that branch like `main`.

---

## Exit checklist
- [ ] `mvp/clean` exists with the five patches applied
- [ ] `tsc` is clean and unit tests pass on your machine, with your own numbers recorded
- [ ] Migrations match the schema (empty `migrate diff`), seed loads, e2e results recorded
- [ ] Every module marked keep or out-of-scope after you read it
- [ ] Decision made on the classroom UI
- [ ] Branch protected; changes only via reviewed PRs

## What this phase deliberately does not do
It does not add features, content, or consent handling. Those belong to Phase 2 of the retrack (one concept end to end), with the real-world setup (teacher, students, consent) running in parallel from today.
