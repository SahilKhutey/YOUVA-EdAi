# Truth Baseline (measured, not claimed)
Measured on a sandbox with Prisma types generated but no query engine (so DB-instantiating tests fail there).
Re-run `scripts/truth-baseline.sh` on a normal machine and replace these numbers with your own.

| Measure | Result |
|---|---|
| Backend TypeScript errors (after `prisma generate`) | **0** |
| Unit tests (non-e2e) | 835 found, 815 passed, 20 failed (18 suites) |
| Static `it(`/`test(` blocks incl. e2e (e2e not run: needs DB/Redis) | ~3,100 |
| Models in schema.prisma | 196 |
| `CREATE TABLE` in migrations | 147 (one migration only; verify with `prisma migrate diff`) |
| Spec files that import no application code | 18 files / 120 tests (all 17 "General Unit Tests" files) |

## Known real defects
- 17 "UT-GEN" files test helper functions defined inside the spec, not application code. They cannot detect real regressions.
- ~12 scaffold `should be defined` specs fail: test modules lack providers (PrismaService/AiService).
- ~7 logic assertions fail: teacher-priority, risk, evaluation, tenant KPIs, learner-state readiness.
- Migrations appear out of sync with the 196-model schema (README's `prisma migrate deploy` path unverified).
## Corrections to earlier claims
- README "7,971 tests" is unverified; reproducible numbers are above.
