# YOUVA EdAI

An early-stage prototype of an adaptive practice tool for school students, built to be used **with a teacher**, not instead of one. It is a work in progress and has not yet been used by real students. Current measured status is in [`docs/TRUTH_BASELINE.md`](docs/TRUTH_BASELINE.md); the scope of the first pilot is in [`MVP_SCOPE.md`](MVP_SCOPE.md).

## What works today (checked by code, not by this README)
- A student logs in, picks a topic, and takes a short multiple-choice quiz drawn from a **teacher-reviewed question bank**. After each answer the system updates a simple mastery estimate and a target difficulty, and the next quiz favours unseen questions near that difficulty.
- A teacher can see student results and can set a student's target difficulty for a topic, with a recorded reason.
- A student cannot start a quiz without an active parent/guardian consent record. A guardian can withdraw consent, and an admin can erase the student's practice data.
- Pilot report numbers can be generated from the database.

Run the checks yourself: `cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e`.

## What it does not do
No distress or content detection (a supervising adult is required), no teacher override screen (it is an API call), no consent screen (entered through the API), and no measured learning outcomes. The mastery update is a simple rule, not a full Bayesian model. Several other modules exist in the code (forum, scheduling, credentials, AI mentor, and more) that are **not part of the pilot** and have not been reviewed for it.

## Stack
Backend: NestJS 11, Prisma 5 with PostgreSQL. Frontend: Next.js 16, React 19, Tailwind 4. Quiz questions never come from an AI unless `QUESTION_SOURCE=AI`. Other modules (AI mentor, content generation) call Google Gemini when used; they are outside the pilot, so do not use them with pilot students.

## Run locally
```bash
# 1. Backend  (needs a PostgreSQL database)
cd backend
cp .env.example .env          # set DATABASE_URL and JWT_SECRET (the server will not start without JWT_SECRET)
npm ci
npx prisma generate
npx prisma migrate deploy     # known issue: the migration history predates the PostgreSQL schema; see "open defects" in docs/TRUTH_BASELINE.md
PORT=3001 npm run start:dev

# 2. Frontend (in another terminal)
cd frontend
npm ci
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Required. Long random string used to sign login tokens |
| `QUESTION_SOURCE` | `BANK` (default): only teacher-reviewed items. `AI`: generate at runtime (not for pilots) |
| `REQUIRE_CONSENT` | Default on. Set `false` only on a local development database |
| `GEMINI_API_KEY` | Only needed when `QUESTION_SOURCE=AI` |

## Add questions
Write items in the format of `backend/content/item-bank/one-step-equations.SAMPLE.json` (the sample is an unreviewed draft), then `npm run import:items -- <file>`. The importer refuses items that are not marked reviewed by a named person.

## Pilot documents
`docs/pilot/`: consent form template, safety protocol, data handling, runbook, success-measures example. `npm run pilot:report` builds the numbers part of a pilot report.

## Working on this repo
Read [`AGENTS.md`](AGENTS.md) (rules for people and AI tools alike), [`docs/MVP_EXIT_CRITERIA.md`](docs/MVP_EXIT_CRITERIA.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md). CI runs type checks, tests, and a claims check that rejects unevidenced statements.
