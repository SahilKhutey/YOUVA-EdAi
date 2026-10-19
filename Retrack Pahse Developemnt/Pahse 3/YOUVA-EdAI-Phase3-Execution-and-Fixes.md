# YOUVA EdAI — Phase 3: Real-World Setup & Safety Net
## Execution Steps and Fixes (built and tested on `phase3/safety-net`, on top of `mvp/clean`)

**Where this sits:** Phase 2 made one student session safe and teacher-controllable. Phase 3 puts people and paper around it: a real teacher, real students, signed consent, a supervision protocol, and a way to withdraw and erase. Three patches are in `phase3-patches/`; they apply on top of the Phase 2 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

**What code cannot do for you:** find the teacher, get the signatures, or have a lawyer review the forms. Those are the steps below marked **(you)**, and they are the actual critical path.

---

## What I built

| Patch | Change |
|---|---|
| 0001 | `docs/pilot/`: consent form template (version `pilot-v1`), one-page safety protocol, data-handling sheet, pilot runbook with session-note template and success measures |
| 0002 | **Consent records and a gate.** A `ConsentRecord` table (guardian name and relationship, form version, signing date, who recorded it, revocation and erasure timestamps, no link to the student account so proof survives erasure). A student with no active record gets 403 on `/practice/generate`; teachers and admins can still preview. Endpoints: `POST /consent`, `GET /consent/student/:id`, `POST /consent/student/:id/revoke` (teacher in scope or admin), `POST /consent/student/:id/erase` (admin only, body `{"confirm":"ERASE"}`). **Withdraw-and-erase** deletes the student's answers, sessions, mastery, points, badges, notifications, goals, class links and teacher notes, anonymises the account, and keeps only the consent/withdrawal record. |
| 0003 | Updates `docs/TRUTH_BASELINE.md` |

**Two safeguards worth knowing about:**
1. **Erasure refuses to run half-way.** If the student has rows in any table the MVP doesn't use (21 tables are listed), it stops with a 409 naming them and deletes nothing, so data is never silently left behind.
2. **A guardrail test reads the Prisma schema** and fails if anyone later adds a table that holds a user, student or teacher id without classifying it in `src/consent/erasure-map.ts`.

**Measured (sandbox):** TypeScript errors 0; 53 suites and 123 tests passing (up from 111), excluding `prisma.service.spec.ts`. Tests use an in-memory database. **Not verified:** consent and erasure against a real Postgres, HTTP-level behavior, the frontend, and any legal review. I did check by schema inspection that the account fields I anonymise exist and that the only foreign key into an erased table (`UserAnswer` to `PracticeSession`) is deleted first.

---

## Things I found while preparing this phase
- **No analytics or tracking scripts** turned up in the frontend code. It does embed YouTube videos and loads sample audio from soundhelix.com; use the no-cookie YouTube domain or remove embeds for the pilot.
- The login token is stored in the browser's `localStorage`. Acceptable for a supervised pilot, a known weakness otherwise.
- A teacher can only act on a student who is in their class or directly assigned, so **enroll the student in a class before recording consent**.
- **Compliance context (verify current dates and have counsel confirm):** from my search, India's DPDP Act 2023 requires verifiable parental consent for children's data and bars tracking, behavioural monitoring and targeted advertising aimed at children; the DPDP Rules were notified in November 2025 with commencement phased over roughly 18 months; exemptions for educational institutions are narrow, and it is unclear whether a separate software provider would qualify. I'm not a lawyer, and this is context, not advice.

---

## Execution steps

### Step 3.1 — Apply the patches (you)
```bash
git checkout mvp/clean            # Phase 1 and 2 patches already applied
git am phase3-patches/*.patch
cd backend && npx prisma generate && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e
```
The new `ConsentRecord` table needs the migration baseline from Phase 2 Step 2.2 to be generated **after** this patch, so it includes the table. If you already ran Step 2.2, regenerate the baseline.

### Step 3.2 — Secure the teacher and 3–8 students (you)
Use the ranked decision tree in `YOUVA-EdAI-TrackA-Execution-Plan.md`. This is the blocker: no teacher, no pilot. Don't start student sessions until 3.2 to 3.6 are done.

### Step 3.3 — Lock the concept, load the real items (you + teacher)
Agree one concept in writing. The teacher writes or reviews 10–15 items in the item-bank format (Phase 2 Step 2.4). Import with `npm run import:items`. Do not use my sample items with students.

### Step 3.4 — Fill in and review the paper (you + advisor)
1. Fill every `[BRACKET]` in `docs/pilot/CONSENT_FORM.md`, `SAFETY_PROTOCOL.md`, `DATA_HANDLING.md` and `PILOT_RUNBOOK.md`.
2. Have a lawyer or an advisor who knows Indian data-protection law and education review the consent form and data-handling sheet. Ask specifically: what consent is required on the pilot date, whether the school (not you) is the right party to obtain it, backup retention, and the retention period for consent records.
3. Decide the end date for the pilot and the retention period; both go on the form.

### Step 3.5 — Create accounts and enroll students (you)
Register the teacher and each student (individual accounts, no sharing). As the teacher: `POST /teacher/classes {name, subject, gradeLevel}`, then `POST /teacher/classes/:id/enroll {studentIds:[...]}`.

### Step 3.6 — Collect signed forms, then record consent (you)
1. Give each parent the form with a short personal explanation and time to ask questions.
2. When a signed form comes back, file it in a locked place, then record it:
```bash
curl -X POST $API/consent -H "Authorization: Bearer $TEACHER_TOKEN" -H "Content-Type: application/json" \
  -d '{"studentId":"...","guardianName":"...","guardianRelation":"mother","formVersion":"pilot-v1","signedAt":"2026-10-20"}'
```
3. Confirm a student **without** a record is blocked: `POST /practice/generate` returns 403.

### Step 3.7 — Rehearse withdrawal on staging (you)
Create a throwaway student, take a quiz, then run revoke and erase (`DATA_HANDLING.md`). Check in the database that the student's rows are gone, the account is anonymised, and the consent record remains. Also check what happens if the student has data in a non-MVP table (expect 409). Time how long the whole thing takes; the promise to parents is same-day.

### Step 3.8 — Dry runs (you)
Run the full session yourself as a student, then with one friendly adult, following `PILOT_RUNBOOK.md`. Fix anything confusing before real students arrive.

### Step 3.9 — Write your success measures down before session one (you)
In the runbook, under "Pilot success measures". Decide them now so the result can't be reinterpreted later.

---

## What is not done
- **No consent screen in the app.** Consent is entered through the API (curl, Postman, or a small script) for the pilot.
- **No automated detection of distress or inappropriate content.** In bank mode students only pick from reviewed options, so there is no free text to moderate, but supervision is the safeguard, as the protocol says. The tool cannot spot a wellbeing concern.
- **Anonymisation is partial by design:** the account fields `cognitiveLevel` and `onboardingComplete` stay on an erased account (I did not reset them). They are not identifying on their own, but note them.
- **Backups.** Erased data remains in database backups until they rotate out; state this to parents or disable backups for the pilot database.
- **Legal review** is yours to arrange.

## Exit checklist
- [ ] Patches applied; tests pass on your machine; migration baseline includes `ConsentRecord`
- [ ] Teacher confirmed; 3–8 students enrolled in the teacher's class
- [ ] Concept agreed in writing; teacher-reviewed items imported
- [ ] Forms completed and reviewed by a qualified advisor
- [ ] A signed form on file and a consent record entered for every participating student
- [ ] Gate confirmed (no record means 403) and withdrawal rehearsed on staging, including the 409 case
- [ ] Supervising adult has read the safety protocol
- [ ] Two dry runs done; success measures written down
