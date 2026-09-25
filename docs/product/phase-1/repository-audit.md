# Phase 1 Repository Audit

**Execution Date:** 2026-09-25  
**Active Branch:** `feature/phase-1-core-learning-loop`  
**Prerequisite Gate:** Phase 0 MVP Scope Lock = `LOCKED` (Verified via `validate-phase-0-scope.mjs --locked`)  
**Audit Scope:** Deep assessment of existing P1 (Core Learning Loop) and P2 (Teacher Dashboard & Override) implementations across both the standalone Python simulation layer (`phase1/`, `phase2/`) and the fullstack TypeScript/NestJS/Next.js application (`backend/`, `frontend/`).

---

## Executive Summary

The repository contains two distinct architectural strata that must not be conflated:
1. **Standalone Python Simulation Engines (`phase1/`, `phase2/`):** A lightweight, mathematically verified reference implementation of 4-parameter BKT, ZPD item selection, and teacher overrides with 37 passing unit tests (16 in P1, 21 in P2) and a 50-item NCERT Grade 8 question bank. However, this is an in-memory test harness completely decoupled from the production API, database, and UI.
2. **Production Fullstack Stack (`backend/`, `frontend/`):** A complex NestJS + Prisma + Next.js architecture containing extensive schemas and enterprise capabilities. While robust teacher scoping and audit logging exist, the core learning loop has been contaminated with speculative, non-MVP mechanisms (Reinforcement Learning difficulty tuning, unexplainable neural cognitive load metrics, LLM question generation fallbacks, and batched quiz submissions rather than an interactive single-item Socratic loop).

The Phase 1 mandate is clear: **AI is not the foundation of the learning loop.** We must strip away opaque ML heuristics in favor of deterministic, explainable BKT state tracking, rule-based adaptive item selection, and authoritative teacher oversight.

---

## P1 Existing Implementation

| Capability | Exists | Functional | Tested | Reusable | Notes / Gap Analysis |
|---|:---:|:---:|:---:|:---:|---|
| **Diagnostic** | YES | PARTIAL | PARTIAL | MODIFY | Python has `diagnostic_assessment.json` (5 items) used for initial placement. Backend has exam-style `AssessmentService` but lacks a dedicated `POST /api/v1/learning/diagnostic/start` Socratic placement flow that returns explainable initial knowledge states. |
| **Knowledge state** | YES | YES | PARTIAL | REFACTOR | Python `TopicKnowledgeState` tracks $P(L_t)$, streaks, and milestones. Backend Prisma has `UserTopicMastery`, but it hardcodes RL difficulty state and lacks concept prerequisite DAG validation and review scheduling. |
| **BKT** | YES | YES | PARTIAL | REFACTOR | Python `BktEngine` implements the exact Corbett & Anderson (1995) 4-parameter model with full parameter validation and 6 tests. Backend `BktService` hardcodes constants ($P(T)=0.2, P(S)=0.1, P(G)=0.25$), clamps to $[0.001, 0.999]$, and has only 1 trivial test ("should be defined"). |
| **Item selection** | YES | PARTIAL | PARTIAL | REPLACE | Python `AdaptiveItemSelector` uses ZPD targeting ($P(\text{correct}) \approx 0.60$). Backend `PracticeService` uses Q-learning RL (`RlDifficultyService`) or calls Gemini API for dynamic generation, violating explainability and deterministic item selection. |
| **Difficulty** | YES | NO | NO | REPLACE | Backend uses an RL epsilon-greedy model (`rl-difficulty.service.ts`). Must be replaced with deterministic, explainable bands: `EASY` ($< 0.30$), `MEDIUM` ($0.30 - 0.70$), `HARD` ($> 0.70$). |
| **Spaced repetition** | PARTIAL | NO | NO | NEW | Python has only short-term anti-repetition (`recent_question_ids`). Backend has a speculative `revision/` module with continuous memory decay. Needs clean deterministic schedule: Correct ($1d \to 3d \to 7d \to 14d$), Incorrect ($0d \to 1d$). |
| **Session tracking** | YES | YES | YES | MODIFY | Backend `PracticeSession` tracks start/end time and score. Lacks per-item sequence idempotency (`sessionId + itemId + responseSequence`) to prevent duplicate BKT updates from client retries. |

---

## P2 Existing Implementation

| Capability | Exists | Functional | Tested | Reusable | Notes / Gap Analysis |
|---|:---:|:---:|:---:|:---:|---|
| **Teacher roster** | YES | YES | YES | REUSE | `TeacherClass`, `TeacherClassEnrollment`, and `ScopeAuthorizationService` provide solid, test-covered RBAC restricting teachers to their assigned students. |
| **Student progress** | YES | YES | YES | MODIFY | `Student360Service` and `AnalyticsController` aggregate progress data. However, frontend displays over-complicated cognitive twin telemetry instead of student-friendly qualitative mastery. |
| **Concept drill-down** | YES | PARTIAL | PARTIAL | MODIFY | Backend can query mastery per topic. Needs standardized endpoint formatting matching the Phase 1 specification (`GET /api/v1/teachers/students/{studentId}/mastery`). |
| **Override** | YES | YES | YES | REFACTOR | Python `TeacherOverrideService` and Backend `TeacherRecommendationService.overrideRecommendation` exist and enforce human-only authority. However, backend endpoint targets recommendations rather than direct concept mastery (`SET_MASTERY`, `INCREASE_DIFFICULTY`, etc.). |
| **Override persistence** | YES | YES | YES | REUSE | Backend persists overrides in `TeacherIntervention` and `TeacherAdaptiveOverride` database records. |
| **Override audit** | YES | YES | YES | REUSE | `LearningLoopAuditService` records immutable audit log entries with `stateBefore`, `stateAfter`, actor ID, and cryptographic/metadata context. |

---

## Findings

### REUSE
1. **Teacher Scope Authorization:** `backend/src/auth/services/scope-authorization.service.ts` provides rock-solid multi-tenant and classroom-level boundary enforcement (`assertTeacherStudentScope`), preventing unauthorized teacher cross-access.
2. **Audit Logging Framework:** `backend/src/learning-loop/audit/learning-loop-audit.service.ts` provides immutable ledger entries for teacher intervention and override actions.
3. **Curriculum Content Bank:** `phase1/content/grade8_linear_equations_bank.json` and `diagnostic_assessment.json` provide 50 verified, SME-reviewed Grade 8 CBSE Linear Equations questions with 3-tier hints and pedagogical explanations.
4. **Python Reference Algorithms:** `phase1/models/bkt_engine.py` provides the canonical mathematical reference for Corbett & Anderson 4-parameter BKT formulas.

### MODIFY
1. **Session & Response Data Model (`backend/prisma/schema.prisma`):**
   - Enhance `PracticeSession` and `UserAnswer` with an explicit sequence number and unique compound constraint `@@unique([sessionId, questionId, sequence])` for strict network retry idempotency.
   - Decouple `UserTopicMastery` from RL difficulty attributes and add explicit fields for `nextReviewAt`, `attemptsCount`, `correctAttemptsCount`, and `incorrectAttemptsCount`.
2. **Teacher Dashboard API (`backend/src/teacher-ops/`):**
   - Align routes to match the Phase 1 spec: `GET /api/v1/teachers/students/:studentId/mastery` and `POST /api/v1/teachers/students/:studentId/overrides`.
   - Support required action types: `SET_MASTERY`, `INCREASE_DIFFICULTY`, `DECREASE_DIFFICULTY`, `FLAG_FOR_ATTENTION`, `CLEAR_FLAG`.
3. **Student Experience UI (`frontend/app/student/`):**
   - Replace probability scores with age-appropriate qualitative encouragement (e.g., "Building confidence with 2-step equations" instead of $P(L) = 0.67$).

### REFACTOR
1. **BKT Engine in TypeScript (`backend/src/learning-engine/services/bkt.service.ts`):**
   - Extract pure BKT calculation into a standalone, database-independent utility module (`bkt.math.ts`).
   - Introduce `BktParameters` configuration interface (`initialMastery`, `learnProbability`, `slipProbability`, `guessProbability`) with default constants:
     ```typescript
     export const DEFAULT_BKT_PARAMETERS: BktParameters = {
       initialMastery: 0.20,
       learnProbability: 0.15,
       slipProbability: 0.10,
       guessProbability: 0.20
     };
     ```
   - Enforce probability invariant: $0.0 \le \text{masteryProbability} \le 1.0$.
   - Write comprehensive unit tests covering boundary conditions, invalid parameters, monotonic increases on correct answers, and monotonic decreases on errors.
2. **Interactive Socratic Practice Service (`backend/src/practice/practice.service.ts`):**
   - Refactor from batched quiz submission (`submitQuiz` processing array of answers) to single-item interactive submission (`POST /api/v1/learning/sessions/:sessionId/responses`).
   - Ensure backend computes correctness independently; reject any client-asserted `isCorrect`.
   - Calculate immediate posterior $P(L_t \mid \text{Obs})$ and transition $P(L_{t+1})$, returning the updated mastery state and next adaptive item in a single roundtrip.

### REPLACE
1. **Reinforcement Learning Difficulty (`rl-difficulty.service.ts`):**
   - Remove reliance on opaque Q-learning / epsilon-greedy algorithms for MVP difficulty selection.
   - Replace with an explainable, deterministic 3-tier difficulty model (`EASY`, `MEDIUM`, `HARD`) mapped to student mastery bands:
     - $P(L) < 0.30 \implies \text{EASY}$ ($0.0 - 0.30$)
     - $0.30 \le P(L) \le 0.70 \implies \text{MEDIUM}$ ($0.30 - 0.70$)
     - $P(L) > 0.70 \implies \text{HARD}$ ($0.70 - 1.0$)
2. **Dynamic LLM Question Generation in Practice Loop:**
   - Remove fallback calls to Google Gemini API (`AiService`) during the student practice loop.
   - Enforce invariant: Only SME-reviewed, pre-published content items from `Question` bank may be served to students during Phase 1.

### NEW
1. **Explainable Adaptive Item Selector (`backend/src/learning-engine/services/adaptive-selector.service.ts`):**
   - Implement deterministic item recommendation algorithm factoring student mastery, prerequisite concept mastery, item difficulty, and spaced repetition review due dates.
   - Produce persisted human-readable explanations for every recommendation (e.g., *"Low mastery on prerequisite concept: One-step addition"*, *"Spaced review due"*).
2. **Deterministic Spaced Repetition Scheduler (`backend/src/learning-engine/services/spaced-repetition.service.ts`):**
   - Implement configurable interval schedule:
     - Correct: $1\text{ day} \to 3\text{ days} \to 7\text{ days} \to 14\text{ days}$.
     - Incorrect: Same session ($0\text{ days}$) $\to 1\text{ day}$.
3. **Phase 1 REST API Endpoints:**
   - `POST /api/v1/learning/diagnostic/start`
   - `POST /api/v1/learning/sessions/:sessionId/responses`
   - `GET /api/v1/students/me/mastery`
   - `GET /api/v1/teachers/students/:studentId/mastery`
   - `POST /api/v1/teachers/students/:studentId/overrides`
4. **Idempotency & Anti-Tamper Security Suite:**
   - Automated tests verifying `TEST-SEC-001` through `TEST-SEC-005` (scope isolation, client forgery prevention).
   - Automated state integrity tests verifying `P1-STATE-001` through `P1-STATE-008`.

---

## Action Plan for Phase 1 Execution

| Cycle | Focus Area | Deliverables |
|---|---|---|
| **Cycle 1** | **Repository Audit** | `docs/product/phase-1/repository-audit.md` (Complete) |
| **Cycle 2** | **Domain & Data Foundation** | Prisma schema update (idempotent response tracking, review intervals, seed migration for 50 NCERT items) |
| **Cycle 3** | **BKT Math Engine** | Standalone TypeScript BKT module with exhaustive boundary and property tests |
| **Cycle 4** | **Adaptive Selection & Spaced Repetition** | Deterministic ZPD selector with explainable reason persistence and interval scheduler |
| **Cycle 5** | **Learning & Override APIs** | NestJS endpoints (`diagnostic/start`, `responses`, `mastery`, `overrides`) with teacher authorization |
| **Cycle 6** | **Content Ingestion & QA** | Migration and automated validation of 50-item NCERT bank (`CONTENT-001` to `CONTENT-006`) |
| **Cycle 7 & 8** | **Student & Teacher UI** | Socratic practice UI and teacher override dashboard |
| **Cycle 9** | **Full System & E2E Gate** | Core integration test, security tests, manual walkthrough script, and `phase-1-exit-report.md` |
