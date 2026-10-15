# Pilot Safety Protocol (one page)
**Principle:** no student uses the tool unless a consent record exists AND a named adult is present.

## Before any session
1. Consent form signed and the consent is entered in the system (a student without an active record cannot start a quiz).
2. Supervising adult named for this session: ______________. A backup contact is reachable: ______________.
3. Only reviewed questions are in use (`QUESTION_SOURCE=BANK`). The AI question mode is OFF for the pilot.
4. The supervising adult has read this page.
5. Students use the practice page only. The AI mentor, forum and other sections are not part of the pilot; do not open them with students.

## During a session
- The supervising adult is in the room (or on the call with camera on) the whole time.
- Students use their own account only; no shared logins.
- If a question looks wrong, confusing, or inappropriate: stop that student, note the question text, tell [OWNER] the same day. Remove the item from the bank before the next session.
- If a student is upset, stuck for a long time, or wants to stop: stop. No pressure to continue.

## Concerns about a child's wellbeing
This tool does not detect or handle wellbeing concerns. If a student says something that worries you, follow the school's own child-protection procedure and contact the designated safeguarding person at the school. Do not rely on the tool for this.

## If something goes wrong
- **Wrong or inappropriate content:** stop sessions, remove the item, write down what happened.
- **Data problem (wrong person's data shown, a leaked password, a lost device with a login):** stop sessions, change `JWT_SECRET` and affected passwords, tell the affected parent/guardian and the school promptly, and write down what happened and when.
- **Parent asks to withdraw:** use the withdrawal steps in DATA_HANDLING.md the same day.

## Not in place yet (so supervision is the safeguard)
Automated detection of distress, bullying or inappropriate content; content moderation of student free text (there is none: students only pick from options); alerts to parents.
