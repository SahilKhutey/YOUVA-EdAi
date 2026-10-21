# Truth baseline - branch mvp/clean (base 2b7d6d1)
Measured in a sandbox with Prisma types generated but no query engine. Re-run scripts/truth-baseline.sh on your machine.

| Measure | Result |
|---|---|
| Files tracked | 385 |
| Backend TypeScript errors | 0 |
| Unit test suites | 74 passed of 74 (excluding prisma.service.spec, which needs a DB engine) |
| Unit tests | 227 passed, 0 failed |
| Real behavioral tests of mastery/difficulty math | 9 (added; previously only "should be defined") |
| Schema models / migrations | 53 / 1 (PostgreSQL baseline) |

## Honest notes
- `BktService` is a heuristic (+20% of the gap on correct, -30% on incorrect), not full Bayesian Knowledge Tracing: P_SLIP and P_GUESS are defined but unused. Fine for an MVP, but do not call it BKT in user-facing claims.
- e2e tests were not run (need Postgres/Redis).
- 18 scaffold specs only assert that a class can be constructed; they now run via auto-mocking but verify little.

## Phase 2 additions (measured)
- Practice flow now serves reviewed bank questions only (QUESTION_SOURCE=BANK default); 6 behavioral tests incl. a full answer-then-harder-quiz loop on an in-memory database.
- Teacher difficulty override with audit record: 4 tests. Item-bank validation: 5 tests. JWT strategy: 2 tests.
- NOT verified here: any real Postgres run, e2e tests, HTTP-level behavior, the frontend.

## Known defects found in Phase 2 (status)
- FIXED: JwtStrategy returned `userId` but 47 call sites read `req.user.id` (teacher, learning-loop, assessment endpoints would receive undefined).
- FIXED: hardcoded 'defaultSecret' JWT fallback.
- FIXED: quizzes were LLM-generated per session with a silent fallback to fake questions ("speed of light (Mock)"); submissions could grade foreign questions, repeat, or score only answered items.
- FIXED: migrations baseline generated for PostgreSQL (lock file now postgresql; initial migration generated from schema.prisma).
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
- Frontend: `tsc --noEmit` reports 0 errors. A production build was verified cleanly with Webpack (32 routes compiled).
- Route usage (static grep of `api.*` calls): the existing UI calls forum, scheduling, goals, announcements, credentials, AI mentor and more; it does not call the teacher override, consent, or learning-loop endpoints. Notifications and feedback use `fetch` and are not counted by that grep.
- NOT verified: real Postgres runtime; real pilot data.

## Phase 6 additions (measured)
- Found by reading the code: the practice page embedded a voice/text AI sidebar; `/ai/generate` required no login; `/edge-sync/*` required no login, accepted writes for any user id, and returned the correct answers for a whole topic. All fixed with tests (7 tests).
- Frontend: practice page now shows plain-language errors (consent missing, no questions, already submitted, no connection) instead of a blank page; 4 Node tests for the message helper and AI switch (`npm test` in `frontend/`); `tsc` 0 errors.

## Phase 7 additions (measured)
- A route inventory built from the real decorator metadata (`npm run` script `scripts/route-audit.ts`; output in `docs/ROUTE_AUDIT.generated.md`): 132 routes at the time of writing, 5 without login, all reviewed. A test fails if a new route is added without login unless it is added to a short reviewed list.
- Found and fixed (with tests, 18 new): anonymous registration as ADMIN or TEACHER and mass assignment of any user field; password hash returned on registration; forged billing webhooks accepted when no secret was set; content search/engage open and trusting a caller-supplied user id; no rate limiting; CORS hardcoded to localhost; API docs public in production.
- Classroom routes checked role and ownership (publish teacher plans, read student submissions, session lookups); websocket gateways authenticated; shared board scoped; AI-graded text guarded.

## Phase 8 additions (measured)
- `npm audit` (production dependencies): backend 26 to 2 (moderate), frontend 30 to 10 (none critical) after non-breaking fixes, `bcrypt` 6 and Next.js 16.4.2.
- Secrets scan of the tree and branch history: clean.
- Render blueprint: fixed API route prefix (`API_PREFIX=api`), removed `--accept-data-loss`, added pilot-safe settings; guarded by 12 tests.
- Security headers (helmet), CORS fallback cascade, and API prefix tested over HTTP (7 tests); teacher analytics and learning-loop scoping (7 tests).

## MVP Finalization & Hardening (measured)
- PostgreSQL migration baseline generated (`20261020000000_init_postgresql_baseline`) and locked to `postgresql`, retiring legacy SQLite migrations.
- Global `ValidationPipe` unknown field stripping enabled (`whitelist: true`, `transform: true`), preventing mass-assignment vulnerability vectors across all endpoints.
- Account lockout protection implemented in `AuthService` (5 consecutive failed login attempts lock account for 15 minutes).
- Forum endpoints hardened with `CreatePostDto`, `CreateReplyDto`, topic existence validation, and author identification; 7 unit tests added in `src/forum/forum.spec.ts`.
- Measured baseline: 227 passing unit tests across 74 test suites in backend; 8 passing unit tests in frontend; 0 TypeScript errors in both frontend and backend.

## Phase 9 additions (measured)
- Scoped classmates-only leaderboard (`GamificationService.getLeaderboard` filtered to shared class enrollments, returning only name, points, rank; no email or user IDs exposed). Unit tests in `src/gamification/leaderboard.spec.ts` (3 tests).
- Seed badges endpoint guarded with `@Roles(Role.ADMIN)`.
- Forum feature switch (`ForumFeatureGuard`) disabling discussion forum endpoints when `ENABLE_FORUM="false"` (default) returning HTTP 403. Unit tests in `src/forum/forum-flag.spec.ts` (2 tests).
- Chat text escaping and markdown sanitization in frontend (`renderChatMarkdown` and `escapeHtml` in `frontend/lib/chat-text.mjs`) preventing HTML injection / XSS in `StudyBuddyWidget`.
- Floating `StudyBuddyWidget` gated by `NEXT_PUBLIC_ENABLE_AI_MENTOR` and Sidebar discussion link gated by `NEXT_PUBLIC_ENABLE_FORUM` via `frontend/lib/features.mjs`.
- HTTP security headers in Next.js (`frontend/next.config.ts` via `frontend/lib/security-headers.mjs`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- Frontend safety unit tests in `frontend/lib/safety.test.mjs` (4 tests). Total frontend tests: 8 passed.
- Route audit script and inventory updated with "Knows caller" verification column. Route review log documented in `docs/ROUTE_REVIEW.md`.
