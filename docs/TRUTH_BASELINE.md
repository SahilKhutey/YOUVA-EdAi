# Truth Baseline (measured, not claimed)
Measured on local environment (Windows x64, Node v24.18.0, npm 11.16.0, Jest 29) on 2026-10-15.
Re-run via `cd backend && npx jest --testPathIgnorePatterns="e2e"`.

| Measure | Result |
|---|---|
| Backend TypeScript errors (after `prisma generate`) | **0** (`npx tsc --noEmit`) |
| Unit tests (non-e2e) | **832 found, 813 passed, 19 failed (18 suites failed, 179 suites passed)** |
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
