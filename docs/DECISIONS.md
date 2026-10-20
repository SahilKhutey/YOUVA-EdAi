# Decision log
Each entry: what was decided, why, and what evidence supports it. Add new entries at the bottom; do not rewrite old ones (add a superseding entry instead).

## D-001: Build the MVP from commit 2b7d6d1, not from `main`
- Context: `main` grew to ~1,400 files with machine-paced commits and unverifiable claims; later history arrives in very large batches.
- Decision: branch `mvp/clean` from `2b7d6d1` (learning loop engine and teacher operations), keep `main` as read-only history.
- Evidence: at that commit the backend had 29 type errors, fixed in `mvp/clean` (see `docs/TRUTH_BASELINE.md`).

## D-002: Quizzes come from a reviewed question bank; AI generation is opt-in
- Context: quizzes were generated live by an LLM, and a failure silently served placeholder questions that were graded.
- Decision: `QUESTION_SOURCE=BANK` by default; AI mode fails with an error instead of serving placeholders.
- Evidence: the original `generateQuiz` code path; behavioral tests in `backend/src/practice/practice.behavior.spec.ts`.

## D-003: The mastery update is a heuristic and is not called BKT
- Context: `BktService` defines slip/guess constants but never uses them; the update is +20% of the gap on a correct answer and -30% of current mastery on an incorrect one.
- Decision: keep it (simple, explainable to a teacher) and describe it accurately.
- Evidence: `backend/src/learning-engine/services/bkt.service.ts`, tests in `adaptive-core.behavior.spec.ts`.

## D-004: Students need an active consent record
- Decision: gate `/practice/generate` for students; `REQUIRE_CONSENT=false` is for local development only.
- Evidence: `backend/src/consent/`, tests in `consent.service.spec.ts`.

## D-005: Erasure refuses to run if data exists in tables the MVP does not use
- Decision: list those tables and delete nothing, so data is never silently left behind. A schema-reading test fails when a new user-linked table is unclassified.
- Evidence: `backend/src/consent/erasure-map.ts` and its tests.

## D-006: Claims about real-world events need an evidence file
- Context: earlier generated documents described a pilot and an evaluator that no record supports.
- Decision: CI runs `scripts/check-claims.ts`; sign-off, review and pilot claims require `[evidence: <existing file>]` on the same line.
- Evidence: `backend/src/governance/claims-check.ts` and tests.

## D-007: Student-facing AI chat is off by default, enforced on the server
- Context: the practice page embedded an AI mentor that sends typed and spoken text to Google Gemini (and, in Chrome, browser speech recognition typically sends audio to a cloud service). This contradicted the pilot premise of reviewed questions with no free text.
- Decision: `ENABLE_AI_FEATURES` (backend, default off) guards the AI mentor, learning chat/start, and `/ai/generate`; `NEXT_PUBLIC_ENABLE_AI_MENTOR` (frontend, default off) hides the sidebar. The server check matters because a hidden button does not stop a direct API call.
- Evidence: `backend/src/common/guards/ai-features.guard.ts` and its tests; `frontend/lib/practice-errors.test.mjs`.

## D-008: Endpoints that were open to the internet now require login
- Context: `POST /ai/generate` forwarded any prompt to a paid AI API with no login; `POST /edge-sync/flush` let anyone write learning and cognitive-state rows for any user id; `GET /edge-sync/curriculum/:topicId` returned every question with its correct answer.
- Decision: login required on both controllers; sync accepts only the caller's own user id; the answer-bearing curriculum pack is teacher/admin only.
- Evidence: `backend/src/edge-sync/edge-sync.spec.ts`, `backend/src/common/guards/ai-features.guard.spec.ts`. Still open: no rate limiting or login brute-force protection anywhere.

## D-009: Public sign-up creates students only, and can be closed
- Context: `POST /auth/register` wrote the request body straight into the user table, so an anonymous caller could register as ADMIN or TEACHER (and set any other user field), and the response returned the password hash.
- Decision: a validated request type accepts only email, password (8 to 72 characters), name and grade level; the role is always STUDENT; the hash is never returned; `ALLOW_PUBLIC_REGISTRATION=false` closes sign-up. Staff accounts are created with `npm run create:user`.
- Evidence: `backend/src/auth/auth.http.spec.ts` (real controller, service and validation; a mutation that re-allowed the role made the test fail).

## D-010: The billing webhook is disabled without a signing secret
- Context: with no `STRIPE_WEBHOOK_SECRET` the handler used a dummy secret and, when the signature check failed, trusted the unsigned JSON, so anyone could mark any user as premium.
- Decision: no secret means the webhook returns 503; an invalid signature returns 400 and grants nothing.
- Evidence: `backend/src/subscription/webhook.security.spec.ts`.

## D-011: Rate limiting, and deployment settings read from the environment
- Decision: a global limit of 120 requests per minute per address, 20 for login and 10 for sign-up (`@nestjs/throttler`). `TRUST_PROXY_HOPS` makes the limiter see real client addresses behind a proxy; `CORS_ORIGINS` replaces the hardcoded localhost origin (a deployed frontend would otherwise be blocked by the browser); API docs are off in production unless `ENABLE_SWAGGER=true`.
- Evidence: `backend/src/auth/auth.http.spec.ts` (the 21st login and 11th sign-up in a minute return 429), `backend/src/security/http-config.spec.ts`.
- Limits: the limit is per address, not per account, so many students behind one school address share it; there is no account lockout.

## D-012: Content search and engagement require login and use the logged-in user
- Context: `/content/search` and `/content/engage` were open and trusted a `userId` sent by the caller.
- Evidence: `backend/src/content-intelligence/content-auth.spec.ts`.

## D-013: Correction to D-008 about edge sync
- `EdgeSyncModule` is imported in `app.module.ts` but never listed in the module's `imports`, so in this branch its routes do not exist at runtime. D-008 described them as open to the internet; that was true of the code, not of the running application here. The login and own-data checks stay as protection in case the module is registered later. A test now lists any controller that exists but is not registered.

## D-014: Classroom routes check the role and who owns the item
- Context: any logged-in user, including a student, could publish any teacher's lesson plan or worksheet, read any worksheet (with its answer key) or any submission by id, start a classroom session naming any other student (which also blocks that student's erasure), and read both users' full records, password hashes included, from a session id.
- Decision: teacher tools need TEACHER or ADMIN; drafts are visible only to their owner or an admin; students see published worksheets without the answer key; a submission is visible to its student, the worksheet's teacher, or an admin; a session starts only with a student in the teacher's scope and is visible only to its two participants or an admin, returning names only. Worksheet submissions must be to a published worksheet, for its own questions, once each.
- Evidence: `backend/src/classroom/classroom-access.spec.ts` (mutation-checked: removing the owner check on publishing made a test fail).

## D-015: Websocket gateways need a login token; the shared board is off by default
- Context: the classroom gateway accepted any client from any origin: anyone knowing a session id could join its room, receive the whiteboard and video-call signalling, send events into it, and change the saved lesson step. The shared board used one hardcoded room for all users.
- Decision: a valid login token is required to connect; a client can join, send to and hear from a session only as its teacher, its student, or an admin; only the teacher or an admin changes the step; allowed origins come from `CORS_ORIGINS`. The board gateway is off unless `ENABLE_SHARED_BOARD=true` and then still needs a token. The frontend now sends the token on both connections.
- Evidence: `backend/src/classroom/gateways.security.spec.ts` (mutation-checked).
- Limit: the allowed-origin list is read when the application starts, so set `CORS_ORIGINS` in the real environment, not only in a `.env` file loaded later.

## D-016: Content generation, project assignment and evaluation are restricted
- Decision: content generation and publishing are teacher/admin only and only the author can publish a draft; assigning a project needs teacher/admin and a student in scope; evaluating a project needs its student, their teacher, or an admin, and is off unless `ENABLE_AI_FEATURES=true`; free-text worksheet answers are not sent to an AI unless that switch is on (they wait for the teacher).
- Evidence: `backend/src/content-gen/ownership.spec.ts`, `backend/src/security/route-coverage.spec.ts`.

## D-017: A teacher reads a student's audit trail only within their own scope
- Context: the route blocked other students but let any teacher read any student's trail.
- Decision: teachers need the student in their class or assignment (admins unchanged).
- Evidence: `backend/src/learning-loop/learning-loop.controller.spec.ts`.

## D-018: Dependency security fixes
- Context: `npm audit` on production dependencies reported 26 vulnerabilities in the backend (2 critical, 18 high) and 30 in the frontend (including a critical in Next.js), at the time of the check (the advisory database changes daily).
- Decision: apply non-breaking fixes in both; upgrade `bcrypt` to 6 (clears the install-time tooling chain; hash format unchanged); upgrade Next.js 16.1.6 to 16.4.2 (same major) as its own commit so it can be dropped. Result: backend 2 moderate, frontend 10 (0 critical; 6 high from the PWA plugin's build tooling, where the suggested fix is a downgrade because 10.2.9 is already the latest).
- Evidence: backend type check and all tests pass after the upgrades and hashing round-trips; frontend type check passes. The frontend production build could not be completed in the sandbox (Google Fonts blocked), so the Next.js upgrade needs a real build before you rely on it.

## D-019: Security headers, API prefix and origin fallback live in one tested function
- Decision: `configureApp` (used by the real server and by tests) sets helmet headers, CORS from `CORS_ORIGINS` or `FRONTEND_URL`, validation, trust-proxy and an optional `API_PREFIX`; invalid settings stop startup. API docs moved to `/docs`.
- Evidence: `backend/src/security/configure-app.spec.ts` (mutation-checked: removing the headers, and removing the prefix, each failed a test).

## D-020: The deployment blueprint matches the code and keeps pilot settings
- Context: `render.yaml` set the frontend API URL to end in `/api` while the backend served routes at the root, so every call from a deployed frontend would have returned 404; it also deployed with `--accept-data-loss`, lacked the pilot-safe settings, and set `FRONTEND_URL` while the CORS code read another name.
- Decision: `API_PREFIX=api` to match the frontend; no `--accept-data-loss`; pilot-safe settings added; a test guards these.
- Evidence: `backend/src/security/render-config.spec.ts` (mutation-checked).

## D-021: Teacher views are limited to the teacher's own students
- Context: the teacher analytics student list, cohort overview, student detail and CSV export returned every student in the system to any teacher; teachers could also read any student's learning-loop context and gate status, and resolve any student's safety escalation.
- Decision: use the existing scope check (class, assignment, session or worksheet link; admins see all). A teacher with no students sees an empty list, so students must be enrolled in a class (Phase 3 Step 3.5).
- Evidence: `backend/src/teacher-analytics/scope.spec.ts`, `backend/src/learning-loop/scope.spec.ts` (mutation-checked on the student detail check).

## D-022: Secrets scan
- Result: no secret-like strings in the current tree or in the history of this branch beyond regex fixtures in a test; no `.env` file was ever committed (only `.env.example`). Scan patterns cover cloud, payment, chat and git-hosting tokens, private keys and connection strings with passwords. A scan cannot prove absence: still rotate any key that has ever been pasted anywhere else.


## D-023: PostgreSQL migration baseline
- Context: `prisma/migrations` contained obsolete SQLite-dialect migrations with `migration_lock.toml` set to `sqlite`, which prevented `prisma migrate deploy` on PostgreSQL databases.
- Decision: generated a clean initial PostgreSQL baseline migration (`20261020000000_init_postgresql_baseline`) using `prisma migrate diff` matching `schema.prisma`, updated `migration_lock.toml` to `postgresql`, and archived legacy SQLite migration folders.
- Evidence: `npx prisma validate` passes.

## D-024: Global unknown field stripping via ValidationPipe whitelist
- Context: requests containing extraneous or unexpected fields could bypass DTO definitions if controllers did not explicitly strip them.
- Decision: enabled `whitelist: true` and `transform: true` in the application's global `ValidationPipe` inside `configureApp`.
- Evidence: `backend/src/security/configure-app.spec.ts` test verifying unknown fields are stripped on submission.

## D-025: Account lockout protection against credential brute-force
- Context: per-IP rate limiting protected endpoints generally, but targeted brute-force attacks against a specific user email across distributed IPs were not locked out.
- Decision: implemented account lockout in `AuthService` (5 consecutive failed attempts lock the targeted email for 15 minutes; cleared upon valid authentication).
- Evidence: `backend/src/auth/auth.service.spec.ts` and `backend/src/auth/auth.http.spec.ts`.

## D-026: Forum input validation and foreign key integrity
- Context: forum endpoints lacked structured class-validator DTOs and did not check if the referenced topic exists before inserting posts, allowing unhandled 500 errors on invalid foreign keys.
- Decision: introduced `CreatePostDto` and `CreateReplyDto` with string length bounds, added topic existence validation, and mapped `req.user.id || req.user.userId`.
- Evidence: `backend/src/forum/forum.spec.ts` (7 tests).
