# MVP exit criteria
The MVP is declared when every row is true and the evidence is in the repo or in your hands. "Check" says how anyone can confirm it.

| # | Criterion | Check |
|---|---|---|
| 1 | Backend type-checks and unit tests pass | `cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e` (CI job `verify`) |
| 2 | Frontend type-checks and builds | `cd frontend && npx tsc --noEmit && npm run build` (CI) |
| 3 | Migrations create the database from scratch | `npx prisma migrate deploy` on an empty PostgreSQL succeeds |
| 4 | README and docs make no unevidenced claims | `npx ts-node scripts/check-claims.ts` passes |
| 5 | Questions served to students were reviewed by the teacher | importer accepts only `reviewed: true` with a name; `QUESTION_SOURCE=BANK` |
| 6 | Every pilot student has a signed form on file and a consent record | count of signed forms equals count of consent records (manual) |
| 7 | Every session was supervised | session notes exist for every session (manual) |
| 8 | Success targets were committed before session one | `docs/pilot/success-measures.json` commit date precedes the first session (git log) |
| 9 | A real pilot report exists, with the limits stated | `docs/PILOT_REPORT_REAL.md` written from `npm run pilot:report` plus notes (manual) |
| 10 | No unresolved incident or withdrawal request | incident log empty or closed (manual) |
| 11 | Withdrawal and erasure were rehearsed | rehearsal recorded in session notes (manual) |
| 12 | Next build chosen from evidence | a completed `docs/NEXT_BUILD.md` entry (manual) |

Rows 1–4 are automated. Rows 5–12 need a person. Do not mark a manual row done on anyone's word, including an AI tool's.
