# YOUVA EdAI — Phase 6: Contract & Exposure Check
## Execution Steps and Fixes (built and tested on `phase6/contract-and-migrations`, on top of Phase 5)

**Where this sits:** Phases 0–5 built the pilot path and its guardrails. Phase 6 asks a question I should have asked earlier: **does the pilot path work, and stay safe, the way a student's browser actually uses it?** I had changed API behavior in Phases 2 and 3 without reading the frontend that consumes it, and I had only written rules about what students should avoid. So I read the practice page end to end and scanned every endpoint for exposure. Four patches are in `phase6-patches/`; they apply on top of the Phase 5 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

**A correction first.** In Phase 5 I said AI was still reachable "outside the quiz path" and told supervisors to keep students on the practice page. That was wrong: **the practice page itself embedded an AI sidebar.** My safety advice would have put a student in front of it.

---

## What I found

| # | Finding | Why it matters | Fix |
|---|---|---|---|
| 1 | The practice page (and the Learn page) embed `VoiceTutor`, which listens through the browser's speech recognition and posts what a student says or types to `/ai-mentor/chat`, which calls Google Gemini. In Chrome, browser speech recognition typically sends audio to a cloud service run by the browser vendor. | Free-form voice and text AI with children, on the page the pilot depends on. It contradicts the reviewed-questions-only premise and the consent form. | A server-side switch `ENABLE_AI_FEATURES` (default off) guards the AI mentor, learning chat/start and `/ai/generate`. A frontend switch `NEXT_PUBLIC_ENABLE_AI_MENTOR` (default off) hides the sidebar. The server check matters because a hidden button does not stop a direct API call. |
| 2 | `POST /ai/generate` required **no login** and forwarded any prompt to the paid AI API. | Anyone on the internet could use your API key and cost budget. | Login required, plus the AI switch. |
| 3 | `POST /edge-sync/flush` required **no login** and wrote learning-session and cognitive-state rows for **any user id in the payload**. | Anyone could pollute any student's records. Those rows live in tables that block erasure (they need manual handling), so a stranger could also stop a withdrawal from completing. | Login required; a caller can sync only their own user id. |
| 4 | `GET /edge-sync/curriculum/:topicId` required **no login** and returned **every question with its correct answer** for a topic. | Any classmate could fetch the whole answer key without logging in. | Teacher or admin only. |
| 5 | When the quiz failed to load (for example, consent not recorded, or no questions imported), the practice page only wrote to the console. The student saw an empty "Practice Session" page. Its loading text also said "Generating your personalized quiz...", which is no longer true. | The first thing a supervisor would see when consent is missing is a confusing blank page. | Plain-language messages for each case (consent missing, no questions, already submitted, no connection); honest loading text. |

**Checked and fine:** the response shapes the practice page reads (`sessionId`, `questions[].id/content/options`, `score`, `results[].questionId/isCorrect/correctAnswer/explanation`) are unchanged by my Phase 2 work, and the page's "answer every question" rule matches the server's validation. Three controller files had no guards at all: `app.controller` (a hello route), `edge-sync` (fixed above), and `credential-mesh/global-verification` (a public lookup by hash; I did not review it, so decide whether the pilot should expose it).

---

## What the patches change

| Patch | Change |
|---|---|
| 0001 | `AiFeaturesGuard` and its use on the AI mentor, `/ai/generate` (now also login-protected), and learning chat/start (4 tests, including a check that the guards are attached to every one of those endpoints) |
| 0002 | Edge-sync access control (3 tests) |
| 0003 | Practice page: error messages, honest loading text, AI sidebar hidden unless enabled, in both the practice and Learn pages; a dependency-free helper with 4 Node tests (`npm test` in `frontend/`), added to the CI workflow |
| 0004 | README, safety protocol, data-handling sheet, scope note, decision log (D-007, D-008) and baseline updated |

**Measured (sandbox):** backend TypeScript errors 0; 58 suites and 149 tests passing (up from 142), excluding `prisma.service.spec.ts`; frontend `tsc` 0 errors and 4 Node tests passing; claims check passes on 13 files.

**Not verified:** I have not run the app in a browser or made an HTTP call; the guard tests check metadata and unit behavior, not requests. CI has not run. The production frontend build could not complete in my sandbox (Google Fonts blocked).

---

## Execution steps

### Step 6.1 — Apply the patches and set the switches (you)
```bash
git checkout mvp/clean            # Phase 1–5 patches applied
git am phase6-patches/*.patch
cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e
cd ../frontend && npx tsc --noEmit && npm test
```
Leave `ENABLE_AI_FEATURES` unset or `false` on the server, and `NEXT_PUBLIC_ENABLE_AI_MENTOR` unset or `false` for the frontend. The frontend value is baked in **at build time**, so rebuild after changing it.

### Step 6.2 — Walk the student path in a real browser (you)
With the app running against a test database:
1. A student **without** a consent record opens a practice topic: you should see the consent message, not a blank page.
2. Record consent (`POST /consent`), reload: questions appear, **no AI sidebar, no microphone prompt**.
3. Answer, submit, read explanations. Try to submit the same quiz again (you should see the "already submitted" message).
4. Stop the backend and submit: you should see the connection message and your answers should still be on the page.
5. As the teacher, use the override call from Phase 2, then start a new quiz as the student.

### Step 6.3 — Watch the network traffic (you)
Open the browser's developer tools, Network tab, and run a full student session. Confirm requests go only to your own API (plus YouTube if a page embeds it). Anything else is a third party to name in the data-handling sheet or remove.

### Step 6.4 — Confirm the closed doors from outside (you)
With `curl`, no token: `POST /ai/generate` and `POST /edge-sync/flush` should return 401, and `GET /edge-sync/curriculum/<topicId>` should return 401. With a **student** token: the curriculum pack should return 403, and `/ai-mentor/chat` should return 403 while the AI switch is off.

### Step 6.5 — Review the rest of the exposed surface (you)
I fixed what I found; I did not review every endpoint. Go through the 33 controller files and, for each, write down who may call it and whether it returns another user's data or answer keys. At minimum look at: `global-verification` (public by design?), `revision`, `assessment`, `analytics`, `content-gen`, `classroom` and anything returning questions or other students' data. Anything outside the pilot path that you don't need can be unregistered in `app.module.ts` once you confirm nothing the pilot uses depends on it (the boot test will tell you if you break wiring).

### Step 6.6 — Add login rate limiting before real students log in (you)
The code has no rate limiting or brute-force protection on login, and student passwords on a school pilot are often weak. Add `@nestjs/throttler` with a strict limit on `/auth/login` and a gentle one elsewhere, and add a test that the 11th rapid login attempt is refused. I did not build this because it adds a dependency and needs a decision on limits, but it should be done before the pilot.

### Step 6.7 — Regenerate the migration baseline (you; still open)
Prisma's schema engine could not be downloaded in my sandbox, so I could not generate it; I also tried newer Prisma versions and they don't help. On your machine, follow Phase 2 Step 2.2, then on an **empty** PostgreSQL run `npx prisma migrate deploy`, followed by `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <url>`; an empty diff means the baseline matches the schema.

### Step 6.8 — Check CI (you)
Push, open the pull request, and confirm `verify` passes, including the new frontend test step and the production build.

---

## Limits and open items
- **Login token in `localStorage`:** a known weakness if any page ever has a script-injection bug; acceptable for a supervised pilot, not beyond it.
- **Other Gemini-calling modules** (content generation, revision, assessment, analytics) are not behind the AI switch, since they don't take student free text, but they do send topic content to Gemini. Decide whether the pilot should allow that.
- **Teacher UI uses `teacher-analytics`,** not the new teacher-ops endpoints, so the override and consent calls still have no screen.
- **Two earlier statements of mine were corrected here:** the Phase 5 advice about the practice page, and the earlier belief that quiz-mode settings alone kept AI out of the student path.

## Exit checklist
- [ ] Patches applied; backend and frontend checks pass on your machine
- [ ] Both AI switches off; frontend rebuilt after setting them
- [ ] Student path walked in a browser, including the consent-missing and connection-lost cases
- [ ] Network tab shows no unexpected third-party calls
- [ ] The four "closed door" checks return the expected status codes
- [ ] Every controller reviewed and written down; unneeded modules decided on
- [ ] Login rate limiting added and tested
- [ ] Migration baseline generated, applied to an empty PostgreSQL, and diff empty
- [ ] CI green
