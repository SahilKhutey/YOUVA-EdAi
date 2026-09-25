# YOUVA EdAI — Phase 5: Known Issues & Technical Debt Register
## Post-Pilot Deficiencies, Reuse Debt, and Phase 6 Transition Constraints

---

## 1. Executive Summary

Phase 5 successfully demonstrated platform reusability and micro-credential issuance for High School secondary education. However, the expansion surfaced specific technical debt, hardcoded assumptions, and cryptographic evolution items that must be documented and addressed prior to subsequent scaling.

---

## 2. Technical Debt & Codebase Issues Register

| Defect ID | Severity | Component | Description & Architectural Impact | Remediation Plan |
|---|---|---|---|---|
| **DEBT-P5-01** | Medium | `ai.controller.ts:196` & `context-minimizer.service.ts:171` | **Hardcoded Grade 8 Fallback**: When `gradeLevel` query parameter is empty or omitted, system defaults to `'Grade 8'`. In a multi-tier platform, missing grade parameters must fail closed or resolve from authenticated `StudentProfile.grade`. | Refactor to require mandatory `gradeLevel` resolution via `EducationTierPolicy` middleware. |
| **DEBT-P5-02** | Medium | `practice.service.ts:134` | **Default Curriculum Topic**: Service defaulted to linear equations when competency code was null. While harmless in Middle School, it causes unexpected topic jumps if a High School session initiates with null parameters. | Enforce strict competency validation in session start DTO. |
| **DEBT-P5-03** | Low | `phase5/models/skills_passport.py` | **Symmetric Key Cryptography (HMAC-SHA256)**: Currently uses shared secret key (`SECRET_KEY`) for credential signing. While tamper-evident and performant for pilot validation, external verifiers cannot independently verify signatures without possessing the secret key. | Migrate to Asymmetric Public-Key Cryptography (Ed25519 / W3C `Ed25519VerificationKey2020` or ECDSA secp256k1) during Phase 7 Institutional Federation. |
| **DEBT-P5-04** | Low | `Teacher Review Queue` | **Batch Approval Scaling**: In cohorts > 40 students, reviewing each student one-by-one requires ~15 minutes of teacher time. While pedagogically rigorous, teachers requested a "Batch Approve All Algorithmic Cleared" button with spot-checking. | Implement bulk authorization workflow with mandatory confirmation modal and randomized spot-check prompts. |
| **DEBT-P5-05** | Medium | `Frontend UI Sync` | **React Component Parity**: High School analytical dashboard components (radar chart, velocity curve) are validated in Python simulation and Next.js prototypes, but require final CSS Polish and design-system alignment before public rollout. | Finalize component library integration in `frontend/components/student/high-school/`. |

---

## 3. Critical Architectural Boundary: The Phase 6 Invariant

> [!CAUTION]
> **PHASE 6 IS NOT A REUSE EXPANSION.**
> 
> A critical risk is assuming that Phase 6 (Pre-School / Kindergarten & Junior Tier) can be built simply by creating another JSON curriculum file and reusing the Middle/High School interface.
> 
> **Why Phase 6 Requires Ground-Up Development:**
> 1. **Zero Text Assumption**: Pre-school learners (ages 3–6) cannot read problem statements or parse mathematical symbols. All interaction must be voice-, audio-, and tap-driven.
> 2. **Parent Co-Pilot Paradigm**: A 4-year-old cannot operate a laptop or tablet autonomously. The parent or kindergarten educator is an active physical co-learner.
> 3. **Psychometric Model Differences**: BKT assumptions regarding slip and guess probabilities differ drastically when inputs are voice/touch.
> 4. **Child Protection**: Pre-school voice telemetry carries distinct biometric data protection risks under DPDP §9 that require specialized consent isolation.

Phase 6 must not begin without a dedicated **Phase 0 Scope Lock** and bespoke interaction architecture.
