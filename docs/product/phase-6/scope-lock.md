# YOUVA EdAI — Phase 6: Early Learner Scope Lock
## Canonical Scope Definition & Boundary Contract (EARLY_LEARNER_V1)

---

## 1. Executive Summary & Core Principle

Phase 6 introduces the **Early Learner Architecture** to YOUVA EdAI. 

### Core Architectural Principle
> **Do not adapt the existing Middle/High School experience downward.**
> Early Learner is engineered as a **constrained execution environment**, not simply a configuration tier.
> The child-facing surface is isolated behind strict interaction, AI policy, and supervision boundaries.

```
                    YOUVA EdAI Platform
                           │
             ┌─────────────┴─────────────┐
             │                           │
      Shared Platform                Tier Policy
             │                           │
   ┌─────────┼─────────┐       ┌─────────┼──────────┐
   │         │         │       │         │          │
Identity   Safety   Learning  Middle   High    Early Learner
Consent    Audit    Content   School   School     │
                                               ┌───┴────┐
                                               │        │
                                            Junior   Kindergarten
                                            Future    Future
```

---

## 2. Locked Scope Contract (`EARLY_LEARNER_V1`)

| Dimension | Specification | Hard Invariant / Boundary |
|---|---|---|
| **Tier Identifier** | `EARLY_LEARNER` | Explicitly distinct from `MIDDLE_SCHOOL` and `HIGH_SCHOOL`. |
| **Release Scope** | `EARLY_LEARNER_V1` | **Locked to Ages 8–10 (Grades 3–4 Primary).** |
| **Explicit Out-of-Scope** | **Kindergarten / Pre-School (Ages 3–7)** | **STRICTLY EXCLUDED** from V1. Requires separate Phase 0 scope locking. |
| **Jurisdiction & Legal Basis**| India (Digital Personal Data Protection Act, 2023 §9) | Mandatory Verified Parental Consent (VPC) via 6-digit OTP prior to session launch. |
| **Subject Domain** | Foundational Mathematics | Number Sense, Counting, Place Value, Basic Mental Arithmetic. |
| **Curriculum Framework** | NCERT / NIPUN Bharat Foundational Stage | Aligned with CBSE Primary Learning Outcomes. |
| **Interaction Mode** | `VOICE_TAP_GUIDED` | Minimal reading assumption. Tap/Touch + Audio guidance. |
| **Permitted AI Behavior** | Structured templates only | Guided questions, structured multiple-choice, encouraging affirmations, audio hints. |
| **Prohibited AI Behavior** | **Zero Open Chat / Free Text** | No conversational LLM generation, no emotional companion avatars, no unsolicited advice. |
| **Data Collected** | Minimal Formative Telemetry | Pseudonymized DID, concept mastery status, structured tap responses, session timestamp. |
| **Data NOT Collected** | **Zero Biometric / Raw Audio** | **NO raw audio recordings saved**, no video, no facial telemetry, zero student PII. |
| **Session Duration Limit** | Hard 15-Minute Cap | Forced session conclusion at 15 minutes to prevent screen fatigue. |
| **Supervision Mode** | Parent Co-Pilot Mandatory | Real-time audio mirror, unilateral parental pause and emergency kill switch. |

---

## 3. Invariant 1: Age as a Security/Policy Attribute

Age is not a UI theme toggle. It is an immutable server-side security attribute evaluated by `EarlyLearnerPolicyEngine`:

```typescript
interface LearnerTierPolicy {
  tier: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "EARLY_LEARNER";
  minimumAge: number;
  maximumAge: number;
  interactionMode: "TEXT" | "VOICE_TAP" | "VOICE_TAP_GUIDED";
  freeTextAIEnabled: boolean;
  parentCopilotEnabled: boolean;
  teacherOversight: "FREQUENT" | "MILESTONE";
  humanReviewRequiredForAmbiguousAI: boolean;
}
```

Any attempt by a client to declare a more permissive tier or request unconstrained conversational endpoints is rejected server-side with `AgeGatingError`.

---

## 4. Formal Scope Sign-Offs

```
[Founder & System Architect]
Name: Dr. Arvind Patel (YOUVA-EdAi Core Leadership)
Decision: APPROVED | Date: 2026-09-02T10:00:00Z

[Early Childhood Academic Lead]
Name: Dr. Sunita Sen (Foundational Learning Initiative, NCERT Consultative Body)
Decision: APPROVED | Date: 2026-09-02T11:30:00Z

[Certified Child Safety Officer]
Name: Dr. Priya Deshpande (Independent Child Wellbeing & Digital Safety Council)
Decision: APPROVED | Date: 2026-09-02T14:00:00Z
```
