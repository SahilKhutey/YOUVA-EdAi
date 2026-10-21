# YOUVA EdAI — Phase 9: Finishing the Review
## What students can see of each other, and what the browser will run. Execution Steps and Fixes (built and tested on `phase9/review-completion`, on top of Phase 8)

**Where this sits:** Phase 7 audited who can call each route; Phase 8 checked dependencies, deployment and teacher-view scoping. Both left a list of things I had not read. Phase 9 reads them: the remaining login-only routes, and the frontend (script injection, security headers, what one student can see about another). Four patches are in `phase9-patches/`; they apply on top of the Phase 8 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

---

## A correction first
In Phase 6 I hid the AI mentor on the practice and Learn pages and told you students were safe from the AI chat. I missed that **a floating AI "study buddy" widget is mounted in the main layout and appears on every page.** The server blocked its calls, but students would still have seen a chat bubble that failed. It is now hidden everywhere unless you turn it on.

---

## What I found

| # | Finding | Why it matters | Fix |
|---|---|---|---|
| 1 | **The leaderboard exposed other students' email addresses.** It returned the top 50 users in the whole system to any logged-in student, with each person's email (whenever no name was set), their user id, and teachers and admins in the ranking. | A child's email address and identity shown to every other child in the system. | Students see only classmates (people in a class with them); teachers see their own students; admins see all students. Display names only, no emails or ids, students only; a student without a name shows as "Student". |
| 2 | **Chat text was inserted into the page as raw HTML.** The study-buddy widget formatted messages with `dangerouslySetInnerHTML` and no escaping. A message or AI reply containing a tag with a script handler would run in a page that also holds the login token in `localStorage`. | Script injection can steal the session. | Characters that could start a tag are escaped first, then bold and italic are applied. Tests try five injection strings. |
| 3 | **The discussion forum was open to every student.** Every logged-in student could read every post and every author's name across the whole system. | Peer contact the pilot is designed to avoid. | Off unless `ENABLE_FORUM=true`; the sidebar link shows only when `NEXT_PUBLIC_ENABLE_FORUM=true`; `render.yaml` sets both to false. |
| 4 | **`POST /gamification/seed-badges` was open to any logged-in user.** | An admin-style write available to every student. | Admin only. |
| 5 | **No security headers on the website's pages.** | Basic hardening was missing. | `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and a `Permissions-Policy` that keeps camera and microphone for this site (the live classroom needs them) and turns geolocation off. A content-security-policy is deliberately **not** set; it needs testing in a real browser against the video call and the installable app. |

**Checked and fine:** login tokens last 60 minutes; I found no code that writes tokens, passwords or emails to logs; the two raw-HTML uses in the frontend are the widget above and a fixed script string in the root layout; the other login-only routes with an id are scoped to the caller (see `docs/ROUTE_REVIEW.md`).

---

## How the review was done (and its limits)
The route inventory now has a **"Knows caller"** column: whether a handler even receives the request object. Of 81 login-only routes, 9 cannot tell who is calling; I read all 9. Of the 72 that can, 22 take an id-like value in the URL, query or body; I read all 22, including the service code each one calls. I also searched request body types for user, student or teacher id properties. The full log is in `docs/ROUTE_REVIEW.md`.

**Not covered:** the roughly 50 routes that use only the caller's own identity and take no id-like input were not read line by line; business-logic abuse (for example repeated forum replies earning points) and AI prompt manipulation were not tested.

---

## The patches

| Patch | Change |
|---|---|
| 0001 | Classmates-only leaderboard with no emails or ids, admin-only badge seeding, forum switch with a reusable switch guard, Render blueprint settings, and tests (5) |
| 0002 | Frontend: chat text escaping, widget and forum link gated, leaderboard page no longer uses user ids, page security headers, and Node tests (4) |
| 0003 | Inventory "Knows caller" column, regenerated `docs/ROUTE_AUDIT.generated.md`, and `docs/ROUTE_REVIEW.md` |
| 0004 | README, safety protocol, decisions D-023 to D-027, baseline |

**Measured (sandbox):** backend TypeScript errors 0; 72 suites and 215 tests passing (up from 210), excluding `prisma.service.spec.ts`; frontend `tsc` 0 errors and 8 Node tests (up from 4); claims check passes. I checked two protections by removing them (the HTML escaping, and leaving emails out of the leaderboard); each made tests fail, and restoring them made them pass. The forum switch and the admin-only badge route are tested but not mutation-checked.

**Not verified:** the page headers are served by `next.config.ts`, which I could not run in a real build here (the production build stops at a Google Fonts download in my sandbox); no browser run of any page; CI has not run.

---

## Execution steps

### Step 9.1 — Apply and check (you)
```bash
git checkout mvp/clean            # Phase 1–8 patches applied
git am phase9-patches/*.patch
cd backend  && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e && npx ts-node scripts/check-claims.ts
cd ../frontend && npx tsc --noEmit && npm test && npm run build
```
Run the frontend build: it is the check I could not do, and it is where the new headers take effect.

### Step 9.2 — Check the headers and the hidden features in a browser (you)
- Open the site with the developer tools Network tab. The main page response should carry `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, a `referrer-policy`, and a `permissions-policy` that allows camera and microphone for this site.
- Start a live classroom session between a teacher and a student account. **The camera and microphone prompts must still work.** If they are blocked, adjust `frontend/lib/security-headers.mjs`.
- Open any page as a student: **no floating chat bubble, no Discussion link.**

### Step 9.3 — Check the leaderboard with real accounts (you)
Create two classes with two students each (Phase 3 Step 3.5). As a student in class A, open the leaderboard: you should see only your classmates and yourself, by display name, and nothing that looks like an email. Set display names that are not full real names if parents prefer (the safety protocol now tells you to).

### Step 9.4 — Check the closed doors (you)
With a student token: `POST /gamification/seed-badges` should return 403; any `/forum/...` route should return 403 while `ENABLE_FORUM` is not `true`. With an admin token, seeding works.

### Step 9.5 — Try the injection yourself (you)
This only applies if you turn the AI widget on: send a chat message such as `<img src=x onerror=alert(1)>`. It should appear as plain text and no alert should run. If you never turn the widget on, this is a test of a feature that stays off.

### Step 9.6 — Decide the remaining items (you)
- A **content-security-policy** for the frontend, once you can test it in a browser against the video call and the installable app.
- **Account lockout** (today only a per-address rate limit, shared by students behind one school address) and moving the **login token out of `localStorage`**: both are larger changes; decide whether the pilot needs them.
- The **migration baseline** for PostgreSQL (still open; the Render blueprint uses `db push` until then).
- The **legal review** of the consent form and data-handling sheet.

---

## Where the work now stands
Across Phases 0–9 the code has gone from a repo with unverifiable claims, an unauthenticated admin sign-up, open classroom and websocket access and a system-wide email leaderboard, to a pilot path that is small, tested and guarded. That is **safer, not proven**: nothing here shows the product helps a student learn, and nothing has run against a real database, deployment or browser in my environment. The remaining risk is mostly not in the code. It is that there is still no teacher, no signed consent and no pilot. Those decide what gets built next, under the rule in `docs/NEXT_BUILD.md`.

## Exit checklist
- [ ] Patches applied; backend and frontend checks pass on your machine, including the frontend production build
- [ ] Headers present on the live site; camera and microphone still work in a classroom session
- [ ] No chat bubble and no Discussion link for students
- [ ] Leaderboard checked with two classes and four students; no emails visible
- [ ] 403 checks passed for badge seeding and the forum
- [ ] Remaining items in Step 9.6 decided and recorded in `docs/DECISIONS.md`
- [ ] Route review log kept up to date whenever a route changes
