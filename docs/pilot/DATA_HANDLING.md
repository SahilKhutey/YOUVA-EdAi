# Pilot Data Handling
*Not legal advice. Confirm with a lawyer who knows Indian data-protection law before the pilot.*

## What the system stores for a pilot student
Account (name, email, hashed password); practice sessions and answers; per-topic mastery and target difficulty; points/streak/badges; notifications; teacher override notes; the consent record. Everything is in the Postgres database. In bank mode no student data is sent to an AI provider.

## What the frontend loads from third parties
No analytics or tracking scripts were found in the frontend code. It embeds YouTube videos (use `youtube-nocookie.com` or remove embeds for the pilot) and sample audio from soundhelix.com. The login token is kept in the browser's localStorage.

## Legal context to check with counsel (as of my research; verify the current position)
- India's DPDP Act 2023 requires verifiable parental consent before processing a child's (under 18) personal data and prohibits tracking, behavioural monitoring and targeted advertising aimed at children, subject to exemptions.
- The DPDP Rules were notified in Nov 2025 with commencement phased over about 18 months. Check which obligations are in force on your pilot date.
- Exemptions for educational institutions are narrow (educational activities and safety). Do not assume a separate software provider is covered; get advice.
- Practical position for the pilot regardless: written parental consent, minimum data, no tracking beyond the learning shown, deletion on request.

## Access
Only the founder (admin) and the pilot teacher can see student data. Use individual accounts; no shared admin logins. Keep the signed forms in a locked place; the system holds only the record.

## Recording consent
Teacher/admin calls `POST /consent` with the student id, guardian name and relationship, `formVersion` (e.g. `pilot-v1`), and the signing date. A student with no active record gets a 403 on `/practice/generate`.

## Withdrawal and erasure (same day as the request)
1. Teacher or admin: `POST /consent/student/:studentId/revoke` (the student is blocked immediately).
2. Admin: `POST /consent/student/:studentId/erase` with body `{"confirm":"ERASE"}`. This deletes answers, sessions, mastery, points, badges, notifications, goals and teacher notes for that student, anonymises the account, and keeps only the consent/withdrawal record.
3. If the response is **409** with a list of tables, the student has data in a feature outside the MVP. Nothing was deleted. Handle those tables manually, then retry.
4. Confirm with the parent in writing.

## Retention
Delete all pilot data at the end of the pilot ([END DATE]) unless parents agree otherwise. Keep consent/withdrawal records for [PERIOD, ask counsel].

## Backups
If backups exist, erased data persists there until the backup rotates out. State the backup retention period to parents, or turn backups off for the pilot database.
