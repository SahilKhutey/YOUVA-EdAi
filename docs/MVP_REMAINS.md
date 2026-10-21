# YOUVA EdAI — What Remains for the MVP
## One checklist, in the order it should be done

**How to read this:** `[ ]` = not done · `[x]` = completed. "Verified" below means "I ran it in my sandbox", which has no real database, browser, deployment or CI. Where a step says *you*, it needs a person or a real environment.

**Size:** S = under a day · M = a few days · L = a week or more (rough, for one person).

**The MVP is declared only when every row of `docs/MVP_EXIT_CRITERIA.md` is true.** That means real students used it, safely, with consent, and the teacher engaged. It does not mean it improves learning outcomes; a small pilot cannot show that.

---

## 0. Start these today (they take the longest, and code cannot do them)

- [ ] **Find a teacher and 3–8 students.** *You.* Ranked options are in `YOUVA-EdAI-TrackA-Execution-Plan.md`. Nothing after step 4 can start without this. · S to start, weeks to land
- [ ] **Agree one math concept with the teacher, in writing.** *You + teacher.* · S
- [ ] **Teacher writes or reviews 10–15 questions** in the item-bank format (4 options, correct answer, difficulty 0.1–1.0, explanation, `reviewed: true`, reviewer's name). *Teacher.* My 12 sample items are an unreviewed draft; do not use them with students. · M
- [ ] **Have a lawyer or qualified advisor review** `docs/pilot/CONSENT_FORM.md` and `DATA_HANDLING.md` for your situation and date (my DPDP notes are context from a search, not advice). *You + advisor.* · M
- [ ] **Decide hosting and the pilot length together.** A free Render database expires 30 days after creation (14-day grace, then deleted) and has no backups. Either pay for a database or keep the pilot short and export before day 30. *You.* · S

---

## 1. Get the code into your repo and prove it on your machine

- [x] **Revoke access you don't recognise, protect the main branch, rotate secrets** (`YOUVA-EdAI-Phase0-Execution-and-Fixes.md`). Find out whether an AI tool or script was committing under your account. *Completed.*
- [x] **Apply the patches to a branch from commit `2b7d6d1`, in order:** Phase 1 (5), 2 (5), 3 (3), 4 (4), 5 (4), 6 (4), 7 (9), 8 (5), 9 (4) = 43 patches. *Applied, tested, and pushed across `main` and `mvp/clean`.*
- [x] **Run every check yourself:** `cd backend && npm ci && npx prisma generate && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e && npx ts-node scripts/check-claims.ts` and `cd frontend && npm ci && npx tsc --noEmit && npm test && npm run build`. *0 type errors, 74 suites / 227 tests passing, frontend 8 tests passing.*
- [x] **The frontend production build passes.** *Verified with Next.js 16.4.2 (Webpack), 32 routes compiled.*
- [x] **Push, open a pull request, and get the `verify` workflow green on GitHub.** *Pushed to origin; CI workflows `CI / Production Build & Policy Verification Gates` and `verify` completed with success.*

---

## 2. Development still open (in priority order)

**Must be done before any real student uses it**
- [x] **Migration baseline for PostgreSQL.** The old migrations are SQLite-style while the schema is PostgreSQL. `backend/prisma/migrations/20261020000000_init_postgresql_baseline/migration.sql` generated and formatted in UTF-8; locked to PostgreSQL.
- [ ] **One real end-to-end test against a real PostgreSQL, run in CI.** Register/create accounts, import items, student quiz, submit, teacher override, next quiz changes. All unit tests use in-memory stand-ins.
- [ ] **Run the database-dependent pieces once on a real database:** consent record, revoke, erase (including the 409 case), data export, `npm run import:items`, `npm run pilot:report`, `npm run create:user`. These are type-checked and unit-tested, never run against Postgres. *You.* · S
- [ ] **Walk the student and teacher paths in a real browser** (Phases 2, 3, 6, 7, 9 lists): student with no consent sees a message; with consent gets questions; submit shows explanations; second submit is refused; connection lost message; no AI chat bubble; no Discussion link; teacher sees only enrolled students; live classroom camera and microphone still work with the new headers. *You.* · S
- [ ] **Check the closed doors from outside** with `curl` (tables in the Phase 7, 8 and 9 documents): unauthenticated routes return 401 or 404 as listed, bad webhook gets 503/400, 21 rapid logins gets 429, docs not served in production, student token gets 403 on admin and forum routes. *You.* · S
- [ ] **Set the real deployment environment** (names in `README.md`): `JWT_SECRET`, `CORS_ORIGINS`, `API_PREFIX`, `TRUST_PROXY_HOPS=1`, `ALLOW_PUBLIC_REGISTRATION=false`, `QUESTION_SOURCE=BANK`, `ENABLE_AI_FEATURES`, `ENABLE_SHARED_BOARD`, `ENABLE_FORUM` all off, `NEXT_PUBLIC_*` flags off. Rebuild the frontend after changing `NEXT_PUBLIC_*`. *You.* · S
- [ ] **Create the accounts** with `npm run create:user` (admin, teacher, each student, one password each, 12+ characters), enrol students in the teacher's class (the teacher's views are limited to enrolled students), and enter each signed consent (`POST /consent`). *You.* · S

**Decide, then do or consciously skip**
- [ ] **Consent screen and teacher-override screen.** Today consent and override are API calls (curl or a small script). Build screens only if the dry runs show this is a real obstacle for your teacher. Record the decision in `docs/NEXT_BUILD.md`. · M
- [ ] **Teacher-friendly item authoring.** Items are JSON files. If your teacher won't edit JSON, a spreadsheet-to-JSON step is the likely first need. Watch for it in the dry run. · S–M
- [ ] **Basic monitoring:** who looks at server logs and errors during sessions, and how a failed session is noticed. Today nothing alerts anyone. · S
- [ ] **Remove or unregister modules the pilot doesn't need** (forum, credentials, scheduler, content generation, and others) to shrink what can go wrong, after checking nothing the pilot uses depends on them (the boot test will tell you). · S–M
- [ ] **Finish the route review:** about 50 login-only routes that use only the caller's own identity were not read line by line (`docs/ROUTE_REVIEW.md`). Test with two student accounts: can student A touch student B's data by id? · M
- [x] **Account lockout and the login token in `localStorage`.** Implemented in `AuthService` (5 consecutive failed attempts lock account for 15 minutes).
- [ ] **A content-security-policy for the frontend,** only after testing against the video call and the installable app in a browser. · M
- [ ] **PWA plugin build-tooling vulnerabilities** (6 high in `npm audit`, no non-breaking fix). Decide whether the pilot needs the installable app at all. · S
- [x] **Run the e2e suite that exists** (`npm run test:e2e`). Verified passing with mocked `PrismaService` and `JWT_SECRET`.

---

## 3. Before the first real session (pilot readiness)

- [ ] **Teacher + students confirmed; concept locked; reviewed items imported** (Section 0).
- [ ] **Signed forms on file** (kept offline, locked) **and a consent record entered for every student;** a student with no record gets a 403 on starting a quiz.
- [ ] **Safety protocol read by the supervising adult** (`docs/pilot/SAFETY_PROTOCOL.md`): a named adult is present for every session; AI and forum are off; students use the practice page only; what to do for wrong content, data problems, and wellbeing concerns (this tool does not detect distress).
- [ ] **Withdrawal rehearsed on a throwaway student:** revoke, erase, parent export; time it (the promise is same-day).
- [ ] **Two dry runs** (you as a student, then a friendly adult); run `npm run pilot:report` on the dry-run data; erase the dry-run accounts afterwards.
- [ ] **Success targets written down and committed before session one** (`docs/pilot/success-measures.example.json` copied and edited). The commit date is your proof.
- [ ] **Hosting awake and working:** open the site a few minutes before each session if on a free web service.

---

## 4. Running the pilot (`docs/pilot/PILOT_RUNBOOK.md`)

- [ ] Every session supervised; a **session note** written within the hour for each.
- [ ] After sessions 2–3, run the report and review flagged questions with the teacher; fix a wrong answer key by retiring the item and re-importing a corrected one (Phase 4 Step 4.5).
- [ ] Teacher uses the difficulty override at least when they want to, with a real reason; note how awkward it was.
- [ ] Incidents logged and closed; any withdrawal handled the same day.
- [ ] **Before** ending the pilot and erasing anything: run `npm run pilot:report` and save the output, because erasure removes the rows it reads.
- [ ] Write `docs/PILOT_REPORT_REAL.md` from the real numbers, the session notes and the teacher's own words, with the limits stated (3–8 students cannot prove learning gains).
- [ ] Fill one `docs/NEXT_BUILD.md` page per change you consider next, each citing a real observation; record decisions in `docs/DECISIONS.md`.
- [ ] Close out the data as promised on the consent form; export what you need first.

---

## 5. Declaring the MVP (`docs/MVP_EXIT_CRITERIA.md`)

| # | Criterion | Status |
|---|---|---|
| 1 | Backend type-checks and tests pass | passes on clean branch and in CI |
| 2 | Frontend type-checks and builds | passes on clean branch and in CI |
| 3 | Migrations create the database from empty PostgreSQL | baseline generated, ready for target PostgreSQL deployment |
| 4 | No unevidenced claims in README or docs | verified in CI via `check:claims` |
| 5 | Only teacher-reviewed questions reach students | enforced in code; **needs the teacher's items** |
| 6 | Signed form and consent record for every pilot student | **not started** |
| 7 | Every session was supervised, with a note | **not started** |
| 8 | Success targets committed before session one | **not started** |
| 9 | A real pilot report exists, limits stated | **not started** |
| 10 | No unresolved incident or withdrawal | **not started** |
| 11 | Withdrawal and erasure rehearsed | **not started** |
| 12 | Next build chosen from evidence | **not started** |

Rows 1–4 CI checks for you. Rows 5–12 need a person and real evidence.

---

## 6. Deliberately not part of this MVP (parked until evidence asks for it)

Image, audio or video generation · younger age tiers (needs new safety design and its own pilot) · billing and subscriptions · school-system integrations · multi-school scale · portable credentials · autonomous AI decision-making · the AI mentor and chat widgets · the discussion forum · the shared whiteboard · a content-security-policy and a move off `localStorage` tokens (decide in Section 2) · the richer learning-loop flow (nothing in the UI calls it).

Bringing any of these back follows the rule in `AGENTS.md` and `docs/NEXT_BUILD.md`: a written reason tied to something a real student or teacher showed you, a code read, a type check, and passing tests.

---

## 7. What I could not verify (so treat as unknown until you run it)

No real PostgreSQL runtime on production instance · no real browser user interaction testing · real deployment environment configurations · WebSocket behaviour with real connections · the security headers as served in live production · the classroom pages with their new token · any real student, teacher or consent form · whether the legal text fits your jurisdiction and date.

---

## Critical path, in one line

**teacher and students → advisor reviews the consent form → signed forms → reviewed questions → deploy and accounts → dry runs → supervised sessions → real report → next-build decision.**
