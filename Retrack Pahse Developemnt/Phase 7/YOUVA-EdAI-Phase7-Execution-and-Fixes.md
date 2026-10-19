# YOUVA EdAI — Phase 7: Exposure Audit
## Who can do what? Execution Steps and Fixes (built and tested on `phase7/exposure-audit`, on top of Phase 6)

**Where this sits:** Phases 0–6 built and protected the pilot path. Phase 7 stops looking only at that path and asks, for the whole running API: **who can call each route, and what can they do to someone else's data?** I did this by generating a list of all 132 routes from the real decorators, reading every route that needs no login or only a login with an id in the URL, and fixing what I found. Nine patches are in `phase7-patches/`; they apply on top of the Phase 6 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

**Why this matters more than the earlier phases suggest:** several of my earlier safety controls (consent records, export, erase) were **bypassable**, because anyone could register themselves as an admin. And the pilot is with children, so a stranger in a live classroom room is not a minor bug.

---

## Two corrections to my own earlier statements
1. **Edge sync (Phase 6):** I said anyone on the internet could write records through `/edge-sync/*`. In this branch that module is imported in `app.module.ts` but never registered, so those routes don't exist at runtime. The hardening stays, but the severity I described was wrong. A test now lists any controller that exists in code but is not registered.
2. **Scope notes (Phase 5):** I treated "outside the pilot path" as "safe to ignore". It isn't; unreviewed code that is registered is reachable.

---

## What I found

**Critical: fix before any real student uses the system**

| # | Finding | Fix |
|---|---|---|
| 1 | **Anyone could register as ADMIN or TEACHER.** `POST /auth/register` wrote the request body straight into the user table, so `"role": "ADMIN"` worked (and any other user field could be set). An admin can record, export and erase consent and student data, so this defeated the Phase 3 controls. The response also returned the password hash. | Sign-up accepts only email, password (8–72 characters), name and grade level; the role is always STUDENT; the hash is never returned; `ALLOW_PUBLIC_REGISTRATION=false` closes sign-up. Staff accounts are created with `npm run create:user`. |
| 2 | **Classroom routes had no role or owner checks.** Any logged-in student could publish any teacher's lesson plan or worksheet, read any worksheet with its answer key, read any submission by id, start a classroom session naming any other student (which also blocks that student's erasure), and read both users' full records, password hashes included, from a session id. | Teacher tools need TEACHER or ADMIN; drafts are visible only to the owner; students see published worksheets without the answer key; a submission is visible to its student, the worksheet's teacher or an admin; sessions start only with a student in the teacher's scope and are visible only to the two participants (names only). Submissions must be for a published worksheet, its own questions, once each. |
| 3 | **The live classroom websocket had no authentication and allowed any origin.** Anyone knowing a session id could join the room, receive the whiteboard and video-call signalling, send events into it, and change the saved lesson step. | A login token is required to connect; a client can join, send to and hear from a session only as its teacher, its student or an admin; only the teacher or admin changes the step; allowed origins come from `CORS_ORIGINS`. The frontend now sends the token. |
| 4 | **The billing webhook accepted forged events.** With no signing secret set it used a dummy secret and trusted unsigned JSON, so anyone could mark any user as premium. | No secret means the webhook is disabled (503); a bad signature is rejected (400). |

**High**

| # | Finding | Fix |
|---|---|---|
| 5 | `/content/search` and `/content/engage` needed no login and trusted a `userId` sent by the caller. | Login required; the logged-in user is always used. |
| 6 | Content generation (AI) was open to students, and any user could overwrite and publish any teacher's draft. | Teacher/admin only; only the author or an admin can publish a draft. |
| 7 | Any user could assign a project to any user, and evaluate any project (sending text to the AI). | Assigning needs teacher/admin and a student in scope; evaluating needs the project's student, their teacher or an admin, and is off unless `ENABLE_AI_FEATURES=true`. |
| 8 | Any teacher could read any student's audit trail. | Teachers need the student in their scope. |
| 9 | The shared whiteboard put every user in one hardcoded room, with open origins. | Off unless `ENABLE_SHARED_BOARD=true`, and still needs a token when on. |
| 10 | Free-text worksheet answers were sent to the AI by default. | Not sent unless `ENABLE_AI_FEATURES=true`; they wait for the teacher. |
| 11 | No rate limiting; CORS allowed only `http://localhost:3000` (a deployed frontend would be blocked by the browser); API docs public in production. | Limits of 120/min overall, 20/min for login and 10/min for sign-up per address; `CORS_ORIGINS` and `TRUST_PROXY_HOPS` read from the environment; docs off in production unless `ENABLE_SWAGGER=true`. |

**Reviewed and left as is:** `GET /global-verification/:hash` (a public credential lookup by hash; returns the skill and an anonymous hash), `GET /` (hello), notifications, scheduler and learning-session id routes (already scoped to the caller), and subjects (public data).

---

## The patches

| Patches | Change |
|---|---|
| 0001–0005 | Rate limiting and deployment settings; registration hardening and the staff-account script; webhook and content endpoints; a **route inventory** built from the real decorators, with a test that fails if any route outside a short reviewed list lacks login (and if any controller is silently unregistered); docs |
| 0006 | Classroom access control (11 tests) |
| 0007 | Websocket authentication, room authorization, board off by default, frontend token (8 tests) |
| 0008 | Content, project and audit-trail access control, plus role checks for teacher routes in the inventory test (5 tests) |
| 0009 | Decisions D-009 to D-017, README and scope notes, regenerated route inventory (`docs/ROUTE_AUDIT.generated.md`), baseline |

**Measured (sandbox):** backend TypeScript errors 0; 66 suites and 191 tests passing (up from 149), excluding `prisma.service.spec.ts`; frontend `tsc` 0 errors and 4 Node tests; claims check passes. The registration test uses the real controller, service, validation and rate limiter over HTTP. I also checked three of the protections by removing them (role forcing at registration, the websocket membership check, the owner check on publishing); each made a test fail, and restoring them made it pass.

**Not verified:** no real server, database or browser; the websocket tests use stand-in clients, not a real socket.io connection; CI has not run; the classroom pages with their new token have not been tried in a browser; and I did not read every one of the 81 routes that need only a login (see Step 7.6).

---

## Execution steps

### Step 7.1 — Apply and check (you)
```bash
git checkout mvp/clean            # Phase 1–6 patches applied
git am phase7-patches/*.patch
cd backend && npm ci && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e && npx ts-node scripts/check-claims.ts
cd ../frontend && npx tsc --noEmit && npm test
```
`npm ci` is needed because patch 0001 adds `@nestjs/throttler`.

### Step 7.2 — Set the environment for your deployment (you)
| Variable | Pilot value |
|---|---|
| `JWT_SECRET` | long random string (the server will not start without it) |
| `CORS_ORIGINS` | your frontend's exact address, for example `https://your-app.vercel.app` (no wildcard) |
| `TRUST_PROXY_HOPS` | `1` on Render or behind one proxy; leave `0` if the server is directly exposed |
| `ALLOW_PUBLIC_REGISTRATION` | `false` |
| `ENABLE_AI_FEATURES`, `ENABLE_SHARED_BOARD` | leave unset (off) |
| `STRIPE_WEBHOOK_SECRET` | leave unset (billing off) |
Set these in the host's real environment (not only a `.env` file): the websocket origin list is read when the application starts.

### Step 7.3 — Create the accounts (you)
With public sign-up closed, create people yourself, one password each (12–72 characters):
```bash
cd backend
NEW_USER_PASSWORD='...' npm run create:user -- --email you@school.org --role ADMIN --name "Your Name"
NEW_USER_PASSWORD='...' npm run create:user -- --email teacher@school.org --role TEACHER --name "Ms Rao"
NEW_USER_PASSWORD='...' npm run create:user -- --email student1@school.org --role STUDENT --name "Student One"
```
The password is read from the environment so it stays out of shell history. Give each person their own.

### Step 7.4 — Check from outside (you)
Try these against the running server, with real accounts:
| Check | Expected |
|---|---|
| Register with `"role":"ADMIN"` (with sign-up open) | account is created as a student; with sign-up closed, 403 |
| 21 rapid wrong logins from one address | the last ones return 429 |
| Student calls `PUT /classroom/lesson-plan/<id>/publish` | 403 |
| Student opens a draft worksheet or another student's submission | 404 |
| Student opens a published worksheet | questions without `correctAnswer` |
| `POST /subscription/webhook` with no signature header | 503 (no secret) or 400 |
| Connect a socket with no token (see below) | disconnected immediately |
For the socket check, from `frontend/`: `node -e "const {io}=require('socket.io-client');const s=io('http://localhost:3001');s.on('disconnect',r=>{console.log('disconnected:',r);process.exit()});s.on('connect',()=>console.log('connected'))"` should print `disconnected` (it may briefly print `connected` first; what matters is that it is dropped and cannot join a room).

### Step 7.5 — Try the classroom in a browser (you)
Teacher starts a session with an enrolled student; both open it. Confirm the whiteboard and step changes work for both, a third logged-in account cannot join, and the workspace page's shared board shows as disconnected (it is off by design).

### Step 7.6 — Finish the review I could not (you)
Of 132 routes, 81 need only a login and 20 of those take an id in the URL. I read and fixed 16 of those 20 (classroom, assessment, learning sessions, notifications, scheduler, audit and gate, subjects, AI-mentor context). **The four forum id routes and the 61 login-only routes without an id in the URL were not each read.** Many act only on the logged-in user, but some take a `userId` or `studentId` in the body or query. A reliable way to check: create two student accounts, and for each such route try, as student A, to act on student B's data (their id, their records). Anything that works is a bug. Regenerate the inventory any time with `cd backend && npx ts-node scripts/route-audit.ts > ../docs/ROUTE_AUDIT.generated.md`.

### Step 7.7 — Hardening I did not do (decide)
- **Security headers** (for example `helmet`); **`ValidationPipe({ whitelist: true })`** globally (needs a check that every request type has decorators, or fields will be dropped); **account lockout** after repeated failures (today only a per-address rate limit, shared by every student behind one school address); shorter login tokens; keeping the token out of `localStorage`; logging and alerting on failed logins.
- Real **end-to-end tests** against a real database, which would catch more than my fakes can.

### Step 7.8 — Still open from earlier phases
Migration baseline for PostgreSQL (Phase 2 Step 2.2), CI passing on GitHub including the frontend production build, and the legal review of the consent form.

---

## Exit checklist
- [ ] Patches applied; backend and frontend checks pass on your machine
- [ ] Environment set as in Step 7.2, in the real host environment
- [ ] Accounts created with `create:user`; public sign-up closed
- [ ] Step 7.4 table checked against the running server
- [ ] Classroom tried in a browser with a teacher and a student, and refused for a third account
- [ ] Remaining login-only routes reviewed with two student accounts (Step 7.6)
- [ ] Decisions on the hardening list in Step 7.7 recorded in `docs/DECISIONS.md`
- [ ] Route inventory regenerated and committed after any later change
