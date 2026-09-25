# YOUVA EdAI — Phase 6: Early Learner Risk Register
## Child Wellbeing, AI Containment, Voice Privacy, and Operational Vulnerabilities

---

## 1. Risk Evaluation Matrix

| Risk ID | Threat Category | Risk Description | Severity | Likelihood | Mitigation Strategy | Fail-Closed Trigger |
|---|---|---|---|---|---|---|
| **RSK-P6-01** | Privacy & Biometrics | Voice recordings retained or converted into biometric voiceprints in violation of DPDP Act 2023 §9. | **CRITICAL** | Low | Volatile memory streaming only; zero disk retention of raw audio; immediate buffer purge post-STT. | System halts STT if disk write is attempted. |
| **RSK-P6-02** | AI Safety | Generative LLM outputs open-ended, confusing, or inappropriate responses to a young child. | **CRITICAL** | Very Low | Total ban on open LLM text generation. All responses are static pre-approved templates or structured slots. | `EarlyLearnerPolicyEngine` blocks any non-templated text. |
| **RSK-P6-03** | Parasocial Attachment | Child forms emotional dependency on synthetic persona or voice avatar ("Do you love me?"). | **HIGH** | Medium | Neutral, warm academic tone; explicit rejection of emotional bonding; prompts filtered by policy keyword trap. | Content flagged; routed to Human Review Queue. |
| **RSK-P6-04** | Screen Time Fatigue | Prolonged device interaction causing visual fatigue, overstimulation, or attentional distress. | **HIGH** | Medium | Hard technical 15-minute session limit; mandatory 60-minute lockout after session completion. | Client interface automatically shuts down at 15m mark. |
| **RSK-P6-05** | Speech Recognition | STT fails on regional Indian accents or child speech articulation, causing frustrating false negatives. | **HIGH** | High | Multi-modal fallback: every question has equivalent tap targets; ambiguous voice routes to clarification. | Ambiguous speech triggers human review queue, never LLM guess. |
| **RSK-P6-06** | Dark Patterns | Inclusion of countdown timers, streak warnings, coin economies, or urgency language. | **HIGH** | Low | `EarlyChildhoodContentGuard` regex traps forbidden words (`hurry`, `quick`, `streak`, `lose`, `coins`). | Prompt submission rejected with `ContentConstraintViolation`. |
| **RSK-P6-07** | Scope Creep | Platform accidentally deployed to 4–6 year old preschoolers without adequate interaction safeguards. | **CRITICAL** | Medium | Server-side `AgeGatingError` strictly blocks accounts with `age < 8` in `EARLY_LEARNER_V1`. | Authentication token creation aborted server-side. |

---

## 2. Real-Time Safety Escalation Pipeline

```
[Child Interaction Event]
           │
           ▼
[EarlyChildhoodContentGuard & Policy Engine]
   ├── Word count > 8 words? ─────────> BLOCKED (ContentConstraintViolation)
   ├── Prohibited keyword detected? ──> BLOCKED (Routed to Human Review)
   ├── Non-structured response? ──────> BLOCKED (PolicyViolationError)
   └── Elapsed session > 15 mins? ────> BLOCKED (ScreenTimeLimitExceededError)
           │
       (Passed)
           │
           ▼
[Prompt Delivered to Child Audio/Screen]
           │
           ▼
[Real-Time Mirror to Parent Co-Pilot] ──> Parent can press PAUSE or KILL SWITCH anytime
```
