# Pilot Runbook
## Week before
- [ ] Teacher and 3-8 students confirmed; topic agreed in writing
- [ ] Teacher's items imported (`npm run import:items`), reviewed and signed off by the teacher
- [ ] Student and teacher accounts created with `npm run create:user` (individual passwords of 12+ characters); `ALLOW_PUBLIC_REGISTRATION=false` so nobody else can sign up
- [ ] Teacher assigned to students (class and enrolment)
- [ ] `CORS_ORIGINS` set to the frontend's address and `TRUST_PROXY_HOPS` set to match the hosting; a login from the real frontend works
- [ ] Every consent form signed, filed, and entered in the system (`POST /consent`)
- [ ] `JWT_SECRET` set, `QUESTION_SOURCE=BANK`, `REQUIRE_CONSENT` not set to false
- [ ] Dry run: you as a student end to end, then a friendly adult
- [ ] Safety protocol read by the supervising adult

## Each session
1. Check consent shows active for each student present.
2. Student logs in with their own account; supervising adult stays in the room.
3. Student takes a quiz; read the explanations together at the end.
4. Afterwards, within the hour, write the session note (below).
5. Teacher adjusts difficulty if needed (`POST /teacher/students/:id/topics/:topicId/difficulty`, with a reason).

## Session note (copy per session)
Date / student / minutes / quiz score / what they got stuck on / any wrong or confusing question (text) / what the teacher did / anything that broke / how the student seemed (bored, engaged, frustrated).

## Pilot success measures (write these BEFORE the first session)
Example: 80% of students finish the first quiz; average score improves between sessions 1 and 3; teacher uses the override at least once and says it was useful; zero content or data incidents; teacher says they would use it again.

## After
Write `docs/PILOT_REPORT_REAL.md` from the real database and real notes only: counts from queries, teacher's words, what broke. If it was small and messy, say so.
