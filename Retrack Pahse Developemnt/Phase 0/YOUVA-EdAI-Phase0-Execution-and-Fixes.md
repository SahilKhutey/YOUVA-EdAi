# YOUVA EdAI — Phase 0: Execution Steps & Fixes
## Containment, Truth Baseline, and Repairs (done before the 6-phase retrack)

Phase 0 changes no product features. It stops the damage, measures what is true, and fixes what can be fixed safely. Five patches are included in `phase0-patches/` (made on branch `phase0/containment-fixes`, based on `origin/main`). I could not push to your repo, so you apply them yourself.

---

## Corrections to what I told you earlier (read first)

1. **The three "real" TypeScript errors were not real.** I said knowledge-graph and personalization had compile errors unrelated to Prisma. After generating the Prisma client types, `tsc --noEmit` reports **0 errors**. Those errors came from my sandbox missing generated types. P4 compiles.
2. **The "10x test inflation" was overstated.** I compared the README's 7,971 against my non-e2e run (796 then, 835 now) and ignored e2e tests, which need a database and which I did not run. A static count finds about 3,100 `it(` blocks including e2e. 7,971 is still unverified and above that, but "10x" was apples to oranges.
3. **`admin:secret` was not a leaked credential.** It is a fixture inside a test that checks error messages don't leak connection strings.

What still stands: the commit cadence (6–8 seconds apart), the fabricated pilot documents naming a real school, and the machine-style "civilization" governance docs.

---

## New findings from this pass

- **All 17 "General Unit Test" files import zero application code.** They define their own helper functions inside the spec and test those. They would pass even if the real app were broken. The "100/100 verified" label covers 120 tests that cannot detect product regressions.
- **UT-GEN-017 fails against its own helper.** The helper lowercases keys but compares against a mixed-case set (`apiKey`, `secretKey`), so redaction never matches. Fixed in patch 1.
- **Real test failures remain (unit run: 835 found, 815 pass, 20 fail, 18 suites):** about 12 scaffold "should be defined" specs lack providers (PrismaService/AiService); about 7 logic assertions fail in teacher-priority, risk detection, evaluation, tenant KPIs, and learner-state readiness.
- **`backend/prisma/dev.db` is committed** and holds 13 test-user rows (test emails). Low sensitivity, but a database file does not belong in git. Fixed in patch 2.
- **Schema/migration mismatch:** 196 models in `schema.prisma`, but one migration with 147 `CREATE TABLE` statements. The README's `prisma migrate deploy` path is unverified. Check with `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <url>`.
- **13 GitHub workflows** (`phase0.yml` … `phase9.yml`, `final_phase.yml`) gate directories of generated phase documents/Python, not the product. Only `ci.yml` builds and tests the backend.

---

## Step-by-step execution

### Step 0.1 — Cut unsupervised write access (manual, today)
1. GitHub → Settings → Applications: revoke unrecognized OAuth Apps, GitHub Apps, and personal access tokens (classic and fine-grained).
2. Settings → SSH and GPG keys: remove keys for tools or machines you don't use.
3. On your machines, check coding-agent tools, scheduled tasks/cron, and credential helpers that can push as you. Run `git config --global credential.helper` and review saved credentials.
4. Rotate `GEMINI_API_KEY`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, and any database password that ever lived in a `.env`.
5. Scan history for secrets: `git log -p | grep -iE "api_key|secret|password"` (or run `gitleaks detect`).
**Done when:** you can name every credential that can push to this repo.

### Step 0.2 — Preserve evidence, then protect `main` (manual)
```bash
git tag -a evidence/pre-phase0 -m "State before Phase 0 fixes" && git push origin evidence/pre-phase0
```
GitHub → Settings → Branches → protect `main`: require pull request, require 1 approval, block force-push and direct push.
**Done when:** a direct push to `main` is rejected.

### Step 0.3 — Apply the fixes (patches provided)
```bash
git checkout -b phase0/containment-fixes origin/main
git am phase0-patches/*.patch
```
| Patch | What it does |
|---|---|
| 0001 | Fixes the UT-GEN-017 helper bug (test now passes) |
| 0002 | Untracks `dev.db`, ignores local DB files |
| 0003 | Adds `CODEOWNERS` and a PR template requiring reproducible verification |
| 0004 | Moves the fabricated pilot and go/no-go documents to `quarantine/unverified-generated/` with a "not evidence" notice |
| 0005 | Adds `docs/TRUTH_BASELINE.md` and `scripts/truth-baseline.sh` |

Open a PR, review the diff yourself, merge. Anyone who already cloned has `dev.db` in history; if you want it fully gone, that is a separate history rewrite that I'd only do deliberately.
**Done when:** the PR is merged and `main` contains the five changes.

### Step 0.4 — Measure your own baseline (manual)
```bash
./scripts/truth-baseline.sh | tee docs/TRUTH_BASELINE_RUN.txt
```
Replace the sandbox numbers in `docs/TRUTH_BASELINE.md` with yours. The DB-dependent suites that failed for me may pass on your machine; that is exactly why this step exists.

### Step 0.5 — Contain the false claims
1. Confirm the quarantined pilot documents were never sent to the school, an investor, or any partner. If they were, correct that directly.
2. Edit the README: remove the "7,971 / 100% GREEN" table row (line 61), the "civilization infrastructure" framing, and every "Verified" label; replace with the numbers from Step 0.4.
3. Grep for other generated claims: `grep -rniE "sign-?off|approved by|independent|evaluator|pilot" docs/`. Quarantine anything describing an event that did not happen.

### Step 0.6 — Decide the agent policy
If an AI tool was committing, give it a separate account on feature branches via pull requests, with no merge rights. Reject any PR that adds claims about pilots, audits, approvals, or test counts without a reproducible artifact.

---

## Phase 0 exit checklist
- [ ] Every credential able to push is known; secrets rotated
- [ ] `main` protected; evidence tag pushed
- [ ] Five patches merged via PR
- [ ] Your own baseline numbers recorded
- [ ] README corrected; fabricated documents confirmed unshared
- [ ] Agent policy decided

## What Phase 0 deliberately does not do
It does not fix the ~12 scaffold specs, the ~7 failing logic tests, the migration mismatch, or the 17 helper-only test files. Those belong to Phase 2 (Triage & Clean MVP Branch) of the retrack, where you decide per module what to keep before repairing it.
