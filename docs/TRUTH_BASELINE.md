# Truth baseline - branch mvp/clean (base 2b7d6d1)
Measured in a sandbox with Prisma types generated but no query engine. Re-run scripts/truth-baseline.sh on your machine.

| Measure | Result |
|---|---|
| Files tracked | 375 (was 1,425 on main) |
| Backend TypeScript errors | 0 (was 29 at base) |
| Unit test suites | 47 (all passing, excluding prisma.service.spec which needs a DB engine) |
| Unit tests | 96 passing |
| Real behavioral tests of mastery/difficulty math | 9 (added; previously only "should be defined") |
| Schema models / migrations | 53 / 5 |

## Honest notes
- `BktService` is a heuristic (+20% of the gap on correct, -30% on incorrect), not full Bayesian Knowledge Tracing: P_SLIP and P_GUESS are defined but unused. Fine for an MVP, but do not call it BKT in user-facing claims.
- e2e tests were not run (need Postgres/Redis).
- 18 scaffold specs only assert that a class can be constructed; they now run via auto-mocking but verify little.
