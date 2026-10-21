# Route review log
A person-readable record of what was checked, by whom, and how. Regenerate the machine list with `cd backend && npx ts-node --transpile-only scripts/route-audit.ts > ../docs/ROUTE_AUDIT.generated.md`. Update this log whenever a route changes.

Method: (1) the inventory reads decorator metadata for all 132 routes; (2) every route with no login, and every login-only route that cannot tell who is calling, was read; (3) every login-only route that knows the caller but takes an id-like value in the URL, query or body was read, including the service method that uses it; (4) request body types (DTOs) were searched for user, student or teacher id properties. A route that only uses the logged-in user's own identity and takes no such input was not read line by line.

## Public (no login): 5 routes
| Route | Verdict |
|---|---|
| `GET /` | hello message; fine |
| `POST /auth/login` | credentials are the check; rate limited |
| `POST /auth/register` | creates students only; rate limited; can be closed |
| `GET /global-verification/:hash` | public credential lookup by hash; returns the skill and an anonymous hash; accepted for now |
| `POST /subscription/webhook` | needs a valid Stripe signature; disabled without a secret |

## Login-only routes that cannot tell who is calling: 9 routes
| Route | Verdict |
|---|---|
| `GET /subjects`, `GET /subjects/:id` | public course data; fine |
| `GET /announcements` | shared notices; fine |
| `GET /gamification/badges/list` | badge catalogue; fine |
| `POST /gamification/seed-badges` | **was open to any logged-in user; now admin only** |
| `POST /ai/generate` | arbitrary prompt to the AI; needs login and `ENABLE_AI_FEATURES=true` |
| `GET /forum/home`, `/forum/topic/:topicId`, `/forum/post/:id` | show every post and author name to every logged-in student; **forum is now off unless `ENABLE_FORUM=true`** |

## Login-only routes that know the caller and take an id-like input: 22 routes
| Route | Where it is enforced |
|---|---|
| `GET /classroom/lesson-plan/:id`, `GET /classroom/worksheet/:id`, `GET /classroom/worksheet/submission/:id`, `GET /classroom/session/:id`, `POST /classroom/worksheet/:id/submit` | owner/participant rules and published-only access in the classroom services (fixed in Phase 7) |
| `POST /assessment-intelligence/evaluate/:id` | project's student, their teacher, or admin; AI switch (Phase 7) |
| `POST /assessment/start`, `/assessment/:sessionId/submit`, `/assessment/:sessionId/log-anomaly` | session must belong to the caller (read in the service) |
| `GET /content/search` | uses the logged-in user; ignores any user id sent (Phase 7) |
| `GET /learning-loop/audit/:studentId`, `GET /learning-loop/gate/:studentId` | students only their own; teachers need the student in scope (Phases 7 and 8) |
| `POST /learning/start`, `POST /learning/end`, `GET /learning/sessions/:id` | session must belong to the caller (read in the service); start is also behind the AI switch |
| `PATCH /notifications/:id/read`, `PATCH /schedule/:id/complete`, `DELETE /schedule/:id` | item must belong to the caller (read in the service) |
| `PATCH /forum/post/:id/upvote`, `POST /forum/post/:postId/reply` | per-user vote; replies are by the caller; whole forum is off by default |
| `GET /ai-mentor/context/:topicId`, `POST /practice/generate` | topic data only / consent and bank rules (Phases 2, 3 and 6) |

## Other fixes from this review
- The leaderboard returned the top 50 users in the system, **including email addresses and user ids**, to any logged-in student. It now returns only classmates (teachers: their own students), students only, display names only.
- The floating AI chat widget on every page is hidden unless `NEXT_PUBLIC_ENABLE_AI_MENTOR=true`, and chat text is HTML-escaped before display (it was inserted as raw HTML).

## Not covered
Business-logic abuse (for example repeated forum replies earning points), AI prompt manipulation, and the line-by-line behaviour of the roughly 50 routes that use only the caller's own identity and take no id-like input.
