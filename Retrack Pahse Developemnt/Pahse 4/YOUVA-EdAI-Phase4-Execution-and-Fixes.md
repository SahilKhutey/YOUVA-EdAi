# YOUVA EdAI — Phase 4: Real Pilot
## Execution Steps and Fixes (built and tested on `phase4/pilot-instrumentation`, on top of Phase 3)

**Where this sits:** Phases 0–3 contained the repo, built a small branch, made one session safe and teacher-controllable, and put consent and supervision around it. Phase 4 is the pilot itself. Four patches are in `phase4-patches/`; they apply on top of the Phase 3 patches (I checked: they apply cleanly and give the identical tree). I cannot push to your repo, so you apply them.

**The honest framing:** a pilot with 3–8 students cannot prove the product works. It can show whether the loop runs without breaking, whether students stay engaged, whether the teacher finds it useful, and what to build next. The code in this phase exists to make the numbers truthful and the report quick, so your effort goes into watching real students.

---

## What I built

| Patch | Change |
|---|---|
| 0001 | **Pilot metrics and a report script.** Pure functions (9 tests, expected values worked out by hand): completion rate, per-student first/last score and change, share of students who improved (only students with 2+ sessions count), per-question analysis with flags (`check_answer_key` when most students pick the same non-keyed answer, `very_hard`, `very_easy`, each needing at least 5 attempts), override counts, and a comparison against targets you wrote down before the pilot (a target that cannot be measured is reported as "not measurable", never as a pass or fail). `npm run pilot:report` pulls the numbers from the database into markdown, with students shown as S1, S2, … and an integrity check for sessions by students with no consent record. |
| 0002 | Session length is now recorded on submit (`durationSeconds` existed in the schema but was never written), so pilot minutes are real (1 test) |
| 0003 | `GET /consent/student/:id/export` returns everything stored about a student (answers with the question text, progress, points, teacher notes, consent records; no password), for a parent's request to see their child's data (2 tests) |
| 0004 | Updates `docs/TRUTH_BASELINE.md` |

**Measured (sandbox):** TypeScript errors 0; 54 suites and 135 tests passing (up from 123), excluding `prisma.service.spec.ts`. **Not verified:** the report script has been type-checked but never run against a database, and no real pilot data exists. Expect to fix small things the first time you run it, ideally on your dry-run data.

---

## Execution steps

### Step 4.1 — Apply and deploy (you)
```bash
git checkout mvp/clean            # Phase 1–3 patches applied
git am phase4-patches/*.patch
cd backend && npx prisma generate && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e
```
Deploy to the environment students will use, with `JWT_SECRET` set, `QUESTION_SOURCE=BANK`, and `REQUIRE_CONSENT` left on. Confirm the migration baseline (Phase 2 Step 2.2) was generated after the Phase 3 patch.

### Step 4.2 — Write your success targets, and commit them before session one (you)
Copy `docs/pilot/success-measures.example.json` to `success-measures.json`, set targets you believe in, and commit it. The commit date is your proof the targets were not chosen after seeing results. Also decide in advance what you'd do on a clear miss (for example, "change the question set, then repeat with the same students").

### Step 4.3 — Pre-flight, using the runbook (you)
Walk the checklist in `docs/pilot/PILOT_RUNBOOK.md`: consent entered for every student, teacher-reviewed items imported, supervising adult has read the safety protocol, two dry runs done. Then run the report script on your **dry-run data** to see that it works:
```bash
cd backend && npm run pilot:report -- --topic "One-Step Equations" --measures ../docs/pilot/success-measures.json
```
If it fails or shows odd numbers, fix that now, not after the pilot. Dry-run students must be removed afterwards (use the erase endpoint on throwaway accounts) so they don't count in the real numbers.

### Step 4.4 — Run the first session small (you)
One or two students first, supervised in person, the safety protocol on the table. Watch where they hesitate, re-read a question, or look bored. After each session, write the session note from the runbook within the hour. Notes are the only record of what the database cannot show: confusion, mood, what the teacher said.

### Step 4.5 — Review the questions after sessions 2–3 (you + teacher)
Run the report and read the "questions to review" table with the teacher. If a question is flagged `check_answer_key`, check the key first: students agreeing on a different answer is usually a wrong key or an ambiguous question, not a class-wide misunderstanding.

To fix a bad item, retire it and re-import a corrected version (the importer skips items whose text already exists among live items, so a plain re-import won't change a wrong key):
```sql
UPDATE "Question" SET source = 'RETIRED' WHERE id = '<question id>';
```
then edit the JSON and run `npm run import:items`. Retired items are no longer served, and past answers stay in the history. Tell the teacher and note it in the session notes, because it changes what later students saw.

### Step 4.6 — Teacher overrides (teacher)
Use the override call from Phase 2 Step 2.5 whenever the teacher wants to change a student's difficulty, with a real reason. There is no override screen yet, so someone may need to help the teacher run it; note how awkward that was, because it is evidence for the next build.

### Step 4.7 — Incidents and requests (you)
Follow `SAFETY_PROTOCOL.md`. For a parent who wants to see their child's data, use the export endpoint; for withdrawal, use revoke then erase (`DATA_HANDLING.md`), the same day. **Run the pilot report before any end-of-pilot erasure**, because erasure removes the underlying rows.

### Step 4.8 — Write the real report (you)
1. Run the report with the full period and save it: add `--out ../docs/PILOT_REPORT_NUMBERS.md`.
2. Create `docs/PILOT_REPORT_REAL.md`: paste the numbers, then add by hand what the script cannot know: incidents, what broke or confused students (from your notes), the teacher's own words including whether they'd use it again, and any questions you retired.
3. Read the result honestly: with 3–8 students, report individual stories and the pattern across them, not percentages as proof. "Two of four students improved" is a fact; "50% improvement rate" overstates it. Say what the pilot cannot show.

### Step 4.9 — Decide the next step from evidence (you)
Pick one of: **repeat** (a problem in the content or flow got in the way of the test, fix it and run again), **extend** (it worked; add students or another concept), or **change** (the main bottleneck was something specific, such as the teacher override being awkward; build that). Record the single next thing to build and the evidence for it. That is the start of the next phase.

### Step 4.10 — Close the pilot (you)
Delete or return the pilot data on the date promised in the consent form, after the report is saved. Keep consent and withdrawal records as set out in `DATA_HANDLING.md`. If the quarantined, machine-generated pilot documents from Phase 0 still exist anywhere in your repo, delete them once the real report exists; the real report should be the only pilot document.

---

## What this phase cannot do for you
- **Find the teacher and students.** Everything here assumes Phase 3's real-world setup happened.
- **Show that learning improved.** Three to eight students over a few sessions cannot separate the tool from practice effects, other teaching, or chance. Treat improvement numbers as a signal, not proof.
- **Replace watching the students.** The script reports what was recorded, not what was felt.
- **Detect wellbeing concerns or moderate content.** Supervision does that, as the protocol states.

## Exit checklist
- [ ] Patches applied; tests pass on your machine; deployed with the right environment settings
- [ ] Success targets committed before the first real session
- [ ] Report script run successfully on dry-run data; dry-run accounts removed
- [ ] Every session supervised and a session note written for each
- [ ] Question flags reviewed with the teacher; any retired items logged
- [ ] No unresolved incidents; any withdrawal handled the same day
- [ ] `PILOT_REPORT_REAL.md` written from real numbers plus real notes, with the limits stated
- [ ] Next step chosen from the evidence, and pilot data closed out as promised
