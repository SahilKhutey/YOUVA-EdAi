# YOUVA EdAI — Phase 8: Dependencies, Deployment, and Teacher-View Scoping
## Execution Steps and Fixes (built and tested on `phase8/dependencies-and-secrets`, on top of Phase 7)

**Where this sits:** Phase 7 audited who can do what in the code. Phase 8 checks the things around the code that a real pilot depends on: the libraries it runs on, the deployment blueprint, the HTTP settings, and the teacher-facing views I had not finished reading. Five patches are in `phase8-patches/`; they apply on top of the Phase 7 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

---

## What I found

| # | Finding | Fix |
|---|---|---|
| 1 | **Vulnerable libraries.** `npm audit` on production dependencies reported 26 findings in the backend (2 critical, 18 high) and 30 in the frontend (one critical, in Next.js). The advisory database changes daily, so rerun it yourself. | Non-breaking fixes in both; `bcrypt` 5 to 6 (clears the install-time tooling chain; the hash format is unchanged and I checked that hashing and comparing still work); Next.js 16.1.6 to 16.4.2 (same major, in its own patch so you can drop it). Backend now 2 moderate; frontend 10, none critical. The remaining highs come from the PWA plugin's build tooling, where npm's suggested "fix" is a downgrade (10.2.9 is already the latest). |
| 2 | **The Render blueprint would have broken a deployed frontend.** `render.yaml` points the frontend at `https://<backend>/api`, but the backend serves routes at the root, so every call would 404. The frontend's own code (axios and `fetch`) is written for an `/api` base. | A new `API_PREFIX` setting; the blueprint sets `api`. A test fails if the two disagree. |
| 3 | **The blueprint deployed with `prisma db push --accept-data-loss`.** Any future schema change that removes data would delete it silently on deploy. | Flag removed: such a change now fails the deploy. (Once real data exists, change the schema through migrations.) |
| 4 | **CORS:** the blueprint sets `FRONTEND_URL`, but my Phase 7 code read only `CORS_ORIGINS`, so a deployed frontend would have been blocked by the browser. | `CORS_ORIGINS`, else `FRONTEND_URL`, else localhost; both set in the blueprint; wildcards rejected. |
| 5 | **No standard security headers.** | `helmet` (content-security-policy off because this server returns JSON). API docs moved to `/docs` and stay off in production unless enabled. |
| 6 | **Pilot-safe settings were not in the blueprint.** | Added: production mode, no public sign-up, bank questions only, AI and shared board off, one proxy hop, AI sidebar off in the frontend build. A test guards them. |
| 7 | **Teacher views were not scoped.** Any teacher could list all students, see the cohort overview and the CSV export for the whole system, open any student's full detail, read any student's learning-loop context and gate status, and resolve any student's safety escalation. | The existing scope check now applies to all of these (class, assignment, session or worksheet link; admins see all). A teacher with no enrolled students sees an empty list, so enrol students in a class first. |
| 8 | **Secrets scan.** | Nothing secret-like in the current tree or in this branch's history (one old commit matched only regex patterns inside a test), and no `.env` file was ever committed (only `.env.example`). A scan cannot prove absence; rotate any key that has ever been pasted elsewhere. |

**Hosting facts that change your pilot plan** (from Render's documentation; check render.com/docs/free for current terms): a free Postgres database **expires 30 days after creation** (with a 14-day grace period to upgrade, after which the data is deleted) and has **no backups**; a free web service **spins down after about 15 minutes idle and takes roughly a minute to wake**. Earlier phases suggested a 4–8 week pilot. On a free database that does not fit.

---

## The patches

| Patch | Change |
|---|---|
| 0001 | Backend dependency updates (`bcrypt` 6, non-breaking fixes) and `helmet` |
| 0002 | Frontend: Next.js 16.4.2 and non-breaking fixes (separate so it can be dropped) |
| 0003 | One tested configuration function (headers, CORS fallback, API prefix, trust-proxy, invalid settings stop startup); `render.yaml` fixed; a test guards the blueprint (12 tests) |
| 0004 | Teacher analytics, learning-loop context and gate, and escalation resolution scoped to the teacher's own students (7 tests) |
| 0005 | README settings, hosting limits in the data-handling sheet, decisions D-018 to D-022, baseline |

**Measured (sandbox):** backend TypeScript errors 0; 70 suites and 210 tests passing (up from 191), excluding `prisma.service.spec.ts`; frontend `tsc` 0 errors and 4 Node tests; claims check passes. I checked four of the new protections by removing them (security headers, API prefix, the data-loss flag in the blueprint, the student-detail scope check); each made a test fail, and restoring them made it pass.

**Not verified:** the Next.js 16.4.2 production build (it stops at a Google Fonts download in my sandbox, as before), `prisma db push` against a real database, and any real Render deployment.

---

## Execution steps

### Step 8.1 — Apply, install and build (you)
```bash
git checkout mvp/clean            # Phase 1–7 patches applied
git am phase8-patches/*.patch
cd backend  && npm ci && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e
cd ../frontend && npm ci && npx tsc --noEmit && npm test && npm run build
```
**The frontend `npm run build` is the check I could not do.** If it fails because of the Next.js upgrade, revert only patch 0002 (`git revert <its commit>`) and keep the rest; then plan the upgrade separately, since the older Next.js carries a critical advisory.

### Step 8.2 — Decide the hosting plan before you create anything (you)
- **Database:** use a paid plan, or note the creation date and plan to export the pilot data and report numbers well before day 30. Do not rely on the 14-day grace period.
- **Web service:** on the free plan, open the site a few minutes before each supervised session so it is awake, or use a plan that stays on.
- I have not quoted prices; check Render's pricing page.

### Step 8.3 — Deploy from the blueprint (you)
Sync `render.yaml`. The first deploy creates the tables with `prisma db push`. Then create accounts (Phase 7 Step 7.3) from your machine using the database's **external** connection string, for example `DATABASE_URL='...' NEW_USER_PASSWORD='...' npm run create:user -- --email ... --role TEACHER`. Do not put the connection string in the repo.

### Step 8.4 — Check the live deployment from outside (you)
| Check | Expected |
|---|---|
| `curl -i https://<backend>/api/subjects` with no token | 401, not 404 (a 404 means the prefix is wrong) |
| `curl -i https://<backend>/subjects` | 404 (routes live under `/api`) |
| `curl -I https://<backend>/api/` | headers include `x-content-type-options: nosniff` and `strict-transport-security`; no `x-powered-by` |
| `curl -i https://<backend>/docs` | 404 in production |
| Log in from the real frontend in a browser | works; no CORS error in the console |
| `curl -i -X POST https://<backend>/api/subscription/webhook` | 503 (billing is off) |
| Practice page as a student | no AI sidebar |

### Step 8.5 — Check the teacher view (you)
As the teacher, with students **enrolled in the teacher's class**, the dashboard lists only those students. A student who is not enrolled should not appear, and opening that student's id directly should be refused.

### Step 8.6 — Keep the dependencies current (you)
Run `npm audit --omit=dev` in both folders each month and after any new dependency. Enabling GitHub's Dependabot (repository Settings, Code security) will open pull requests for fixes; they still need your review and a passing `verify` check. Decide separately what to do about the PWA plugin's build-time findings (for example, whether the pilot needs the installable app at all).

### Step 8.7 — Still open
Migration baseline for PostgreSQL (needed before you stop using `db push`), the four forum id routes and the other login-only routes not individually read, account lockout, the login token in `localStorage`, global request validation that drops unknown fields, and the legal review of the consent form.

---

## Limits
- `npm audit` reports known advisories, not every weakness, and some findings do not apply to how the code uses a library.
- The header, CORS and prefix tests use a small stand-in application with the real configuration function; they prove the function, not your deployed environment (that is what Step 8.4 is for).
- The blueprint test reads the file as text, so it catches the mistakes I found, not every possible mistake.

## Exit checklist
- [ ] Patches applied; backend and frontend checks pass on your machine, **including the frontend production build**
- [ ] Hosting plan decided (database plan or export schedule; waking the service before sessions)
- [ ] Deployed from the blueprint; accounts created from your machine
- [ ] Step 8.4 table checked against the live site
- [ ] Teacher dashboard shows only enrolled students
- [ ] `npm audit` rerun and the monthly routine scheduled
- [ ] Open items in Step 8.7 recorded in `docs/DECISIONS.md` or the baseline
