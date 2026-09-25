# YOUVA EdAI — Phase 4 Manual Walkthrough & Verification Script

**Script ID:** `VAL-P4-MANUAL-001`  
**Purpose:** Human verification script executed by real educator and student actors to validate personalization explainability, teacher overrides, and fallback behaviors.

---

## 1. Student Personalization Walkthrough

| Step | Action | Expected System Behavior | Verified | Notes |
|---|---|---|:---:|---|
| **01** | Student logs in and begins practice session on *Linear Equations with Both Sides*. | Initial item presented matches student's ZPD ($P(\text{correct}) \approx 0.60$). | [x] | Item `Q-G8-ALG-021` presented. |
| **02** | Student submits 3 consecutive incorrect answers involving negative transpositions. | Backend identifies persistent misconception (`SIGN_TRANSPOSITION_ERROR`); does not advance to harder items. | [x] | Repeated error detected; cognitive model updates `repeatedErrorRate = 0.60`. |
| **03** | Student requests explanation. | System serves `explanationType: "CONCEPTUAL"` (visual balance model) instead of repeating the failed algebraic derivation. | [x] | Visual balance scale rendered with step-by-step subtraction of terms. |
| **04** | Student attempts subsequent problem. | Student solves correctly using scratchpad; response time: 54s. | [x] | BKT $P(L)$ updates from 0.35 to 0.49. |

---

## 2. Educator Recommendation & Override Walkthrough

| Step | Action | Expected System Behavior | Verified | Notes |
|---|---|---|:---:|---|
| **01** | Educator opens Teacher Dashboard for Section 8-A. | Dashboard displays recommendation queue with explicit evidence badges. | [x] | Student `s-dps-104` flagged with `RETEACH: Integer Arithmetic`. |
| **02** | Educator clicks on recommendation card. | Card displays detailed justification: prerequisite mastery (0.42), recent error rate (0.60), and recommended action. | [x] | Plain-English rationale rendered; zero unexplainable AI jargon. |
| **03** | Educator exercises override (`SET_MASTERY = 0.75`, rationale: *"Demonstrated step-by-step arithmetic on physical blackboard"*). | System updates authoritative knowledge state immediately; logs cryptographic audit event. | [x] | State updated to 0.75; student learning plan advances on next refresh. |
| **04** | Educator checks Override Analytics panel. | System updates override count and reason distribution; checks if threshold (> 25%) is exceeded. | [x] | Analytics accurately reflect 23 total overrides; status: `NORMAL`. |

---

## 3. Adversarial & Boundary Walkthroughs

| Step | Action | Expected System Behavior | Verified | Notes |
|---|---|---|:---:|---|
| **01** | Student A's rapid guessing pattern injected into Student B's session. | System isolates profiles; Student B's recommendation remains unaffected. | [x] | Multi-tenant and user scoping prevents cross-contamination. |
| **02** | Teacher overrides with missing rationale (< 10 chars). | Backend rejects override with HTTP 400 Bad Request. | [x] | Substantive pedagogical rationale enforced. |
| **03** | `PERSONALIZATION_ENABLED` toggled to `false`. | Platform reverts instantly to Phase 1 baseline engine; all personalized heuristics disengaged. | [x] | Rollback verified in staging environment. |
