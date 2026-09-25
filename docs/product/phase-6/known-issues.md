# YOUVA EdAI — Phase 6: Known Issues & Technical Debt Register
## Post-Pilot Deficiencies, Acoustic Variations, and Boundaries for Phase 7 Transition

---

## 1. Executive Summary

Phase 6 successfully established the Early Learner Constrained Execution Environment (CEE) for Grade 3 (ages 8–10), proving that voice/tap interaction and parent co-pilot supervision can operate safely under DPDP Act 2023 §9. 

This register documents specific technical debt, acoustic constraints, and operational learnings to be resolved prior to subsequent scaling.

---

## 2. Technical Debt & Codebase Issues Register

| Defect ID | Severity | Component | Description & Architectural Impact | Remediation Plan |
|---|---|---|---|---|
| **DEBT-P6-01** | Medium | `speech-recognition.service.ts` | **Regional Acoustic Variation**: STT first-pass accuracy dropped to ~81% on regional pronunciations of single-digit numbers (e.g. South Indian / East Indian phonetics). While tap fallback prevented failure, voice completion was lower in these subsets. | Train a lightweight, edge-deployable phoneme acoustic model fine-tuned on diverse Indian regional accents during Phase 7. |
| **DEBT-P6-02** | Low | `parent-copilot.service.ts` | **Companion WebSocket Battery Drain**: High-frequency transcript mirroring (5 Hz heartbeat) consumed ~6% battery on low-end Android smartphones over a 15-minute session. | Throttle companion ping rate to 1 Hz with delta compression. |
| **DEBT-P6-03** | Low | `Teacher Review Queue UI` | **Mobile Tablet Viewport in Lab**: The teacher review queue renders inside a side drawer optimized for desktop; primary teachers walking around computer labs requested a full-screen tablet view. | Implement responsive full-screen tablet layout in `frontend/app/teacher/primary/`. |
| **DEBT-P6-04** | Medium | `content-bank/` | **Asset Cache Warming**: In low-bandwidth school networks, first-time loading of spoken audio clips caused an initial 3-second asset download delay. | Implement aggressive Service Worker pre-caching of all 20 foundational audio clips during PWA install. |

---

## 3. The Permanent Phase 6 Boundary Reminder

> [!CAUTION]
> **KINDERGARTEN (AGES 3–7) REMAINS STRICTLY OUT OF SCOPE.**
> 
> The successful completion of Phase 6 (`EARLY_LEARNER_V1` for ages 8–10) **DOES NOT** authorize deploying YOUVA EdAI to 4- or 5-year-old kindergarten children.
> 
> Preschool and kindergarten learners operate in the pre-operational developmental stage, cannot reliably interpret 2D visual symbols, experience much higher speech recognition variance, and require physical tangible manipulatives.
> 
> Any future expansion into ages 3–7 must initiate with a completely independent **Phase 0 Scope Lock**.
