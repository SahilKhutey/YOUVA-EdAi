# Truth baseline - branch mvp/clean (base 2b7d6d1)
Measured in a sandbox with Prisma types generated but no query engine. Re-run scripts/truth-baseline.sh on your machine.

| Measure | Result |
|---|---|
| Files tracked | 381 (was 1,425 on main) |
| Backend TypeScript errors | 0 (was 29 at base) |
| Unit test suites | 70 passed of 70 (excluding prisma.service.spec, which needs a DB engine) |
| Unit tests | 210 passed, 0 failed |
| Real behavioral tests of mastery/difficulty math | 9 (added; previously only "should be defined") |
| Schema models / migrations | 53 / 4 |

## Honest notes
- `BktService` is a heuristic (+20% of the gap on correct, -30% on incorrect), not full Bayesian Knowledge Tracing: P_SLIP and P_GUESS are defined but unused. Fine for an MVP, but do not call it BKT in user-facing claims.
- e2e tests were not run (need Postgres/Redis).
- 18 scaffold specs only assert that a class can be constructed; they now run via auto-mocking but verify little.

## Phase 2 additions (measured)
- Practice flow now serves reviewed bank questions only (QUESTION_SOURCE=BANK default); 6 behavioral tests incl. a full answer-then-harder-quiz loop on an in-memory database.
- Teacher difficulty override with audit record: 4 tests. Item-bank validation: 5 tests. JWT strategy: 2 tests.
- NOT verified here: any real Postgres run, e2e tests, HTTP-level behavior, the frontend.

## Known defects found in Phase 2 (not all fixed)
- FIXED: JwtStrategy returned `userId` but 47 call sites read `req.user.id` (teacher, learning-loop, assessment endpoints would receive undefined).
- FIXED: hardcoded 'defaultSecret' JWT fallback.
- FIXED: quizzes were LLM-generated per session with a silent fallback to fake questions ("speed of light (Mock)"); submissions could grade foreign questions, repeat, or score only answered items.
- OPEN: migrations are SQLite-dialect (lock file says sqlite; init uses DATETIME) while schema.prisma is postgresql. `prisma migrate deploy` on Postgres will fail. Baseline must be regenerated (see Phase 2 doc).
- OPEN: the frontend calls /practice/*; nothing calls /learning-loop/* (the richer intervention/gate flow).
- OPEN: a teacher override sets the starting difficulty; later answers move it again (no pin).

## Phase 3 additions (measured)
- Consent records (`ConsentRecord`), a gate on `/practice/generate` for students, revocation, and withdraw-and-erase (12 tests; in-memory database).
- A guardrail test reads the Prisma schema and fails if any table holding a user/student/teacher id is not classified in `src/consent/erasure-map.ts`.
- Pilot documents in `docs/pilot/`: consent form template, safety protocol, data handling, runbook.
- NOT verified: erasure and consent against a real Postgres, HTTP-level behavior, the frontend, any legal review.
- Known gaps: no consent screen in the UI; no automated wellbeing/content detection (supervision is the safeguard); `cognitiveLevel` and `onboardingComplete` remain on an anonymised account; YouTube embeds in the frontend.

## Phase 4 additions (measured)
- Pilot metrics as pure functions (9 tests, expected values hand-computed): completion, per-student first/last change, improvement share, item analysis with answer-key and difficulty flags, overrides, comparison against targets written before the pilot.
- `npm run pilot:report` builds the numbers from the database (typechecked, NOT run against a real database). It cannot describe what happened in the room.
- `durationSeconds` is now recorded on submit. Parent data-access export added (2 tests).
- NOT verified: the report script against a real Postgres; any real pilot data exists yet.

## Phase 5 additions (measured)
- Whole-application boot test (dependency graph with a stubbed database): fails when a provider is missing (checked by removing one), passes when restored.
- Claims check (6 tests) runs over README, docs, MVP_SCOPE and AGENTS; it passes on the current repo and caught a wrongly worded sentence in the new README while it was being written.
- Frontend: `tsc --noEmit` reports 0 errors. A production build could not be completed in the sandbox (Google Fonts download blocked); the CI workflow will run it.
- Route usage (static grep of `api.*` calls): the existing UI calls forum, scheduling, goals, announcements, credentials, AI mentor and more; it does not call the teacher override, consent, or learning-loop endpoints. Notifications and feedback use `fetch` and are not counted by that grep.
- NOT verified: the CI workflow has not run on GitHub; real Postgres; real pilot data.

## Phase 6 additions (measured)
- Found by reading the code: the practice page embedded a voice/text AI sidebar; `/ai/generate` required no login; `/edge-sync/*` required no login, accepted writes for any user id, and returned the correct answers for a whole topic. All fixed with tests (7 tests).
- Frontend: practice page now shows plain-language errors (consent missing, no questions, already submitted, no connection) instead of a blank page; 4 Node tests for the message helper and AI switch (`npm test` in `frontend/`); `tsc` 0 errors.
- Still open: migrations vs PostgreSQL schema (Prisma's schema engine could not be downloaded in the sandbox, so no baseline was generated); no rate limiting or login brute-force protection; production frontend build not completed in the sandbox.

## Phase 7 additions (measured)
- A route inventory built from the real decorator metadata (`npm run` script `scripts/route-audit.ts`; output in `docs/ROUTE_AUDIT.generated.md`): 132 routes at the time of writing, 5 without login, all reviewed. A test fails if a new route is added without login unless it is added to a short reviewed list.
- Found and fixed (with tests, 18 new): anonymous registration as ADMIN or TEACHER and mass assignment of any user field; password hash returned on registration; forged billing webhooks accepted when no secret was set; content search/engage open and trusting a caller-supplied user id; no rate limiting; CORS hardcoded to localhost; API docs public in production.
- Correction: the edge-sync routes described as open in Phase 6 were not registered in this branch (see D-013).
- Still open: migrations vs PostgreSQL schema; no account lockout; per-address rate limit shared by students on one school address; handlers' ownership checks (whether a student can read another student's data by id) were not reviewed route by route; global validation does not strip unknown fields; no security headers middleware; frontend production build and CI not run here.

## Phase 7 additions, part 2 (measured)
- Read the 23 login-only routes that take an id in the URL. Found and fixed, each with tests (23 new in classroom, gateways, content and assessment): classroom routes with no role or owner checks (publish anyone's plan or worksheet, read any worksheet with its answer key or any submission, create a session naming any student, session lookup returning password hashes); an unauthenticated classroom websocket (join any session, hear and send whiteboard and video signalling, change the lesson step); a shared board that put every user in one room; content publishing and project assignment/evaluation with no ownership checks; free-text worksheet answers sent to the AI by default.
- Two mutation checks (removing the gateway membership check; removing the publish owner check) each made a test fail.
- Also fixed: the `learning-loop` audit-trail route let any teacher read any student's trail; teachers now need the student in their scope (1 test).
- Still open: notifications, scheduler and learning-session id routes were read and are scoped to the caller, but forum and the other login-only routes were not each read; AI-graded free text can be manipulated by the student's wording; global validation does not strip unknown fields; no security-headers middleware.

## Phase 8 additions (measured)
- `npm audit` (production dependencies): backend 26 to 2 (moderate), frontend 30 to 10 (none critical) after non-breaking fixes, `bcrypt` 6 and Next.js 16.4.2. Remaining frontend highs come from the PWA plugin's build-time tooling.
- Secrets scan of the tree and branch history: nothing found (see D-022).
- Render blueprint: fixed an API URL / route prefix mismatch that would have 404'd every call from a deployed frontend, removed `--accept-data-loss`, added pilot-safe settings; guarded by a test (5 tests).
- Security headers, CORS fallback and API prefix tested over HTTP (7 tests); teacher analytics and learning-loop scoping (7 tests).
- Not verified: the Next.js 16.4.2 production build (blocked in the sandbox); `prisma db push` against a real database; a deployed Render environment.
- Still open: migration baseline for PostgreSQL; forum and other login-only routes not each read; account lockout; token kept in `localStorage`; global validation does not strip unknown fields.
