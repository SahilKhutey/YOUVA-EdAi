# YOUVA EdAI v0.1 — Active Scope, Traceability & Evidence Matrix

> **Document ID:** DOC-MVP-001  
> **Branch:** `build/narrow-mvp-v0.1`  
> **Status:** AUDITED & VERIFIED  
> **Working Reference:** `freeze/pre-narrow-mvp-v0.1`  
> **Archive Reference:** `archive/full-architecture`  
> **Active Target:** Middle School Math (Grade 6–8) • One-Step Linear Equations

---

## 1. Active Scope Status Lifecycle

In accordance with the locked v0.1 execution contract, no capability is marked complete without progressing through the rigorous lifecycle:
$$\text{AUDITING} \longrightarrow \text{AUDITED} \longrightarrow \text{PORTED} \longrightarrow \text{INTEGRATED} \longrightarrow \text{VERIFIED}$$

### Scope Registry:

### P1 — Core Learning Loop
- **Status:** `VERIFIED`
- **Scope:** Delivery of curated one-step equation questions, server-side answer evaluation, deterministic difficulty adjustment (`nextDifficulty`), and step-by-step inverse operation explanation.
- **Trace:**
  - Source: [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts), [`backend/src/v01/v01-adaptive.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-adaptive.service.ts), [`backend/src/v01/v01-content.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-content.ts)
  - Runtime Entry: `V01Module` in [`backend/src/app.module.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/app.module.ts#L61)
  - API: `GET /api/v01/student/:id/session/start`, `POST /api/v01/student/:id/attempt`
  - Automated Tests: [`backend/src/v01/test/v01.spec.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/test/v01.spec.ts) (Sections 1, 2, 3, 6 — 15 tests pass)
  - UI Implementation: [`frontend/app/v01/page.tsx`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/frontend/app/v01/page.tsx)

### P2 — Teacher Visibility + Override
- **Status:** `VERIFIED`
- **Scope:** Single-table real-time roster displaying student name, concept, attempts, correct, current level, status, and one action: `[ NEEDS HELP ]`. The override immediately changes next item selection to foundational remediation, persists in audit logs, and cannot be overwritten by AI.
- **Trace:**
  - Source: [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L200-L280) (`getTeacherOverview`, `setTeacherOverride`)
  - Runtime Entry: `V01Module`
  - API: `GET /api/v01/teacher/overview`, `POST /api/v01/teacher/override`
  - Automated Tests: [`backend/src/v01/test/v01.spec.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/test/v01.spec.ts) (Sections 4 & 5 — 4 tests pass)
  - UI Implementation: [`frontend/app/v01/teacher/page.tsx`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/frontend/app/v01/teacher/page.tsx)

### P3 — Consent Record & Safety Protocol
- **Status:** `VERIFIED`
- **Scope:** Documented guardian consent verification required prior to session initiation. Adult supervisor present and immediately reachable throughout the session.
- **Trace:**
  - Source: [`backend/src/v01/v01.service.ts#L95-L125`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L95-L125) (`enrollStudent`, `startSession`)
  - Runtime Entry: `V01Module`
  - Operating Procedure: [`docs/pilot/v0.1-pilot-operating-procedure.md`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/pilot/v0.1-pilot-operating-procedure.md)
  - Automated Tests: [`backend/src/v01/test/v01.spec.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/test/v01.spec.ts#L115-L125) (`should block enrollment without explicit guardian consent`)

---

## 2. Capability Evidence Matrix

| Capability | Actual File Path | Runtime Entry | Test Suite | Trace Result | v0.1 Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Question Delivery** | [`backend/src/v01/v01-content.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-content.ts) | `V01Service.startSession` | `v01.spec.ts:L240` | Serves 18 hand-authored items across Easy, Medium, Hard | **ACTIVE IN v0.1** |
| **Answer Evaluation** | [`backend/src/v01/v01-adaptive.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-adaptive.service.ts#L40) | `V01Service.submitAttempt` | `v01.spec.ts:L45-L75` | Server-derived; normalizes whitespace, case, `x=`, decimals | **ACTIVE IN v0.1** |
| **Difficulty Adjustment** | [`backend/src/v01/v01-adaptive.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-adaptive.service.ts#L15) | `V01Service.submitAttempt` | `v01.spec.ts:L25-L42` | Deterministic: Correct raises difficulty, Incorrect lowers | **ACTIVE IN v0.1** |
| **Explanation on Error** | [`backend/src/v01/v01-content.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01-content.ts) | `V01Service.submitAttempt` | `v01.spec.ts:L95` | Returns clear inverse operation explanation for every question | **ACTIVE IN v0.1** |
| **Student Attempt History**| [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L160) | `V01Service.submitAttempt` | `v01.spec.ts:L80-L115` | Immutable attempt record appended to `data/v01_pilot_attempts.jsonl` | **ACTIVE IN v0.1** |
| **Teacher Visibility** | [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L205) | `GET /api/v01/teacher/overview` | `v01.spec.ts:L185` | Real-time table: Attempts, Correct, Level, Status | **ACTIVE IN v0.1** |
| **Teacher Override** | [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L240) | `POST /api/v01/teacher/override` | `v01.spec.ts:L160-L215` | Precedence enforced: forces foundational item; AI cannot overwrite | **ACTIVE IN v0.1** |
| **Consent Record** | [`backend/src/v01/v01.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/v01/v01.service.ts#L95) | `POST /api/v01/student/enroll` | `v01.spec.ts:L115` | Documented guardian consent required before session initialization | **ACTIVE IN v0.1** |
| **Gemini Integration** | [`backend/src/ai/gateway/ai-gateway.service.ts`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/ai/gateway/ai-gateway.service.ts) | `POST /api/ai/generate` | `ai-gateway.spec.ts` | Retained as secondary background tool; excluded from v0.1 core path | **FROZEN / EXCLUDED** |

---

## 3. Active vs. Excluded Boundary

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ACTIVE IN BUILD/NARROW-MVP-V0.1                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Middle School Math: One-Step Linear Equations                        │
│ • 18 Hand-authored text items (6 Easy, 6 Med, 6 Hard)                  │
│ • Deterministic adaptive transitions (EASY <-> MEDIUM <-> HARD)        │
│ • Server-side answer evaluation with case/prefix normalization         │
│ • Step-by-step inverse operation explanation on error                  │
│ • Student practice screen (/v01)                                       │
│ • Teacher oversight table & [ NEEDS HELP ] override (/v01/teacher)     │
│ • Override precedence & append-only session audit logging              │
│ • Documented guardian consent & in-person adult supervision protocol   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│             FROZEN IN ARCHIVE/FULL-ARCHITECTURE & FREEZE TAG           │
├────────────────────────────────────────────────────────────────────────┤
│ • Pre-School, Elementary, High School, Higher-Ed tiers                 │
│ • Multimodal generation (Stable Diffusion, Piper TTS, Whisper STT)     │
│ • Multi-tenant district hierarchy and institutional analytics          │
│ • Autonomous AI policy engine, circuit breakers, and drift alarms      │
│ • Automated W3C Verifiable Credentials and Open Badges                 │
│ • Complex Knowledge Graph traversal and Cognitive Twin simulations     │
└────────────────────────────────────────────────────────────────────────┘
```
