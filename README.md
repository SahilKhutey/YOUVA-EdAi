# YOUVA EdAI

An early-stage prototype of an adaptive practice tool for school students, built to be used **with a teacher**, not instead of one. It is a work in progress and has not yet been used by real students. Current measured status is in [`docs/TRUTH_BASELINE.md`](docs/TRUTH_BASELINE.md); the scope of the first pilot is in [`MVP_SCOPE.md`](MVP_SCOPE.md).

## What works today (checked by code, not by this README)
- A student logs in, picks a topic, and takes a short multiple-choice quiz drawn from a **teacher-reviewed question bank**. After each answer the system updates a simple mastery estimate and a target difficulty, and the next quiz favours unseen questions near that difficulty.
- A teacher can see student results and can set a student's target difficulty for a topic, with a recorded reason.
- A student cannot start a quiz without an active parent/guardian consent record. A guardian can withdraw consent, and an admin can erase the student's practice data.
- Pilot report numbers can be generated from the database. Logins are rate limited (20 per minute per address), and responses carry standard security headers.

Run the checks yourself: `cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e`.

## What it does not do
No distress or content detection (a supervising adult is required), no account lockout after repeated failed logins (only a per-address rate limit), no teacher override screen (it is an API call), no consent screen (entered through the API), and no measured learning outcomes. The mastery update is a simple rule, not a full Bayesian model. Several other modules exist in the code (forum, scheduling, credentials, AI mentor, and more) that are **not part of the pilot** and have not been reviewed for it.

## Stack
Backend: NestJS 11, Prisma 5 with PostgreSQL. Frontend: Next.js 16, React 19, Tailwind 4. Quiz questions never come from an AI unless `QUESTION_SOURCE=AI`. The AI mentor and learning-chat endpoints, where a student's typed or spoken text reaches Google Gemini, are **switched off by default** (`ENABLE_AI_FEATURES`). Other modules (content generation, revision, assessment) can also call Gemini and are outside the pilot.

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
| `ENABLE_AI_FEATURES` | Default off. `true` lets student free text and voice reach the AI mentor. Keep off for pilots |
| `NEXT_PUBLIC_ENABLE_AI_MENTOR` | Frontend. Default off. `true` shows the AI mentor sidebar on practice and learn pages |
| `GEMINI_API_KEY` | Only needed for AI features or `QUESTION_SOURCE=AI` |
| `ALLOW_PUBLIC_REGISTRATION` | Default `true` (creates student accounts only). `false` closes public sign-up; create accounts with `npm run create:user` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (for example your frontend's URL). Default: `http://localhost:3000` only |
| `TRUST_PROXY_HOPS` | Number of reverse proxies in front of the server (0 to 3). Set `1` on Render or behind nginx, or rate limiting will treat everyone as one user |
| `ENABLE_FORUM` | Default off. The forum shows every logged-in student every post and author name. Set `true` only if that is intended. The frontend link is shown only when `NEXT_PUBLIC_ENABLE_FORUM=true` |
| `ENABLE_SHARED_BOARD` | Default off. The shared whiteboard uses one room for every user, so it stays off for pilots; when on, a login token is still required |
| `API_PREFIX` | Optional URL prefix for every route, for example `api`. `render.yaml` sets `api` because the deployed frontend calls `https://<backend>/api/...`. Locally leave unset and set `NEXT_PUBLIC_API_URL` without `/api` |
| `FRONTEND_URL` | Used as the allowed browser origin when `CORS_ORIGINS` is not set |
| `ENABLE_SWAGGER` | API docs are served at `/docs` outside production; set `true` to serve them in production |
| `STRIPE_WEBHOOK_SECRET` | Billing webhook is disabled unless this is set |

## Add questions
Write items in the format of `backend/content/item-bank/one-step-equations.SAMPLE.json` (the sample is an unreviewed draft), then `npm run import:items -- <file>`. The importer refuses items that are not marked reviewed by a named person.

## Pilot documents
`docs/pilot/`: consent form template, safety protocol, data handling, runbook, success-measures example. `npm run pilot:report` builds the numbers part of a pilot report.

## Working on this repo
Read [`AGENTS.md`](AGENTS.md) (rules for people and AI tools alike), [`docs/MVP_EXIT_CRITERIA.md`](docs/MVP_EXIT_CRITERIA.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md). CI runs type checks, tests, and a claims check that rejects unevidenced statements.
