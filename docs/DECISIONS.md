# Decision log
Each entry: what was decided, why, and what evidence supports it. Add new entries at the bottom; do not rewrite old ones (add a superseding entry instead).

## D-001: Build the MVP from commit 2b7d6d1, not from `main`
- Context: `main` grew to ~1,400 files with machine-paced commits and unverifiable claims; later history arrives in very large batches.
- Decision: branch `mvp/clean` from `2b7d6d1` (learning loop engine and teacher operations), keep `main` as read-only history.
- Evidence: at that commit the backend had 29 type errors, fixed in `mvp/clean` (see `docs/TRUTH_BASELINE.md`).

## D-002: Quizzes come from a reviewed question bank; AI generation is opt-in
- Context: quizzes were generated live by an LLM, and a failure silently served placeholder questions that were graded.
- Decision: `QUESTION_SOURCE=BANK` by default; AI mode fails with an error instead of serving placeholders.
- Evidence: the original `generateQuiz` code path; behavioral tests in `backend/src/practice/practice.behavior.spec.ts`.

## D-003: The mastery update is a heuristic and is not called BKT
- Context: `BktService` defines slip/guess constants but never uses them; the update is +20% of the gap on a correct answer and -30% of current mastery on an incorrect one.
- Decision: keep it (simple, explainable to a teacher) and describe it accurately.
- Evidence: `backend/src/learning-engine/services/bkt.service.ts`, tests in `adaptive-core.behavior.spec.ts`.

## D-004: Students need an active consent record
- Decision: gate `/practice/generate` for students; `REQUIRE_CONSENT=false` is for local development only.
- Evidence: `backend/src/consent/`, tests in `consent.service.spec.ts`.

## D-005: Erasure refuses to run if data exists in tables the MVP does not use
- Decision: list those tables and delete nothing, so data is never silently left behind. A schema-reading test fails when a new user-linked table is unclassified.
- Evidence: `backend/src/consent/erasure-map.ts` and its tests.

## D-006: Claims about real-world events need an evidence file
- Context: earlier generated documents described a pilot and an evaluator that no record supports.
- Decision: CI runs `scripts/check-claims.ts`; sign-off, review and pilot claims require `[evidence: <existing file>]` on the same line.
- Evidence: `backend/src/governance/claims-check.ts` and tests.

## D-007: Student-facing AI chat is off by default, enforced on the server
- Context: the practice page embedded an AI mentor that sends typed and spoken text to Google Gemini (and, in Chrome, browser speech recognition typically sends audio to a cloud service). This contradicted the pilot premise of reviewed questions with no free text.
- Decision: `ENABLE_AI_FEATURES` (backend, default off) guards the AI mentor, learning chat/start, and `/ai/generate`; `NEXT_PUBLIC_ENABLE_AI_MENTOR` (frontend, default off) hides the sidebar. The server check matters because a hidden button does not stop a direct API call.
- Evidence: `backend/src/common/guards/ai-features.guard.ts` and its tests; `frontend/lib/practice-errors.test.mjs`.

## D-008: Endpoints that were open to the internet now require login
- Context: `POST /ai/generate` forwarded any prompt to a paid AI API with no login; `POST /edge-sync/flush` let anyone write learning and cognitive-state rows for any user id; `GET /edge-sync/curriculum/:topicId` returned every question with its correct answer.
- Decision: login required on both controllers; sync accepts only the caller's own user id; the answer-bearing curriculum pack is teacher/admin only.
- Evidence: `backend/src/edge-sync/edge-sync.spec.ts`, `backend/src/common/guards/ai-features.guard.spec.ts`. Still open: no rate limiting or login brute-force protection anywhere.
