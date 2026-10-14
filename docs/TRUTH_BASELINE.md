# Truth baseline - branch mvp/clean (base 2b7d6d1)
Measured in a sandbox with Prisma types generated but no query engine. Re-run scripts/truth-baseline.sh on your machine.

| Measure | Result |
|---|---|
| Files tracked | 381 (was 1,425 on main) |
| Backend TypeScript errors | 0 (was 29 at base) |
| Unit test suites | 53 passed of 53 (excluding prisma.service.spec, which needs a DB engine) |
| Unit tests | 123 passed, 0 failed |
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
