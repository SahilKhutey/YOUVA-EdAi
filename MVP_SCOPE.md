# MVP scope (mvp/clean)
Base: commit 2b7d6d1 (learning loop engine + teacher operations). Target: Middle School math, one concept,
text-based adaptive practice, teacher visibility with one override. See docs/TRUTH_BASELINE.md for measured status.

## In scope (kept)
learning-engine (mastery + difficulty), practice, assessment, learning-loop, teacher-ops, auth, users, subjects, prisma.
## Present in the code, not needed by the pilot path
The existing UI also calls forum, scheduling, goals, announcements, credentials and an AI mentor. These are not needed for the pilot (login, topic, quiz, results, teacher view) and have not been reviewed for it. Do not extend them; supervising adults should point students to the practice page only.
No frontend code calls the teacher override, consent, or learning-loop endpoints: they have no UI yet.
The live classroom (whiteboard, video call) now only admits its two participants and needs a login token. The shared whiteboard on the workspace page is off by default (`ENABLE_SHARED_BOARD`). Neither is part of the pilot path.
The Learn page is built around AI chat, so it does not work while `ENABLE_AI_FEATURES` is off (the default). Keep pilot students on the Practice page.

## Rule for adding anything
Needs a written reason tied to something observed with a real student or teacher, a typecheck, and a passing test.
