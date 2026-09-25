# YOUVA EdAI — Phase 6: Early Learner Policy Engine Specification
## Authoritative Server-Side Policy Evaluation, Prohibited AI Actions, and Age Security

---

## 1. Architectural Role & Invariants

The `EarlyLearnerPolicyEngine` is the authoritative security boundary separating early learners from general AI inference. It operates as a server-side interceptor on all inbound and outbound educational events.

### Hard Policy Invariants
1. **Age is a Security/Policy Attribute**: Learner age dictates server-side feature access; clients cannot request more permissive tiers.
2. **Zero Free-Text Open Chat**: Children cannot enter unconstrained text prompts, and language models cannot output non-templated text.
3. **Structured Responses Only**: AI responses must conform to certified structural archetypes (`EarlyLearnerAIInteraction`).
4. **Fail-Closed on Ambiguity**: Ambiguous, low-confidence, or off-topic speech routes to human review and pre-recorded audio, never generative guessing.

---

## 2. Policy Interfaces & Domain Model

```typescript
// Shared Technical Policy Model across NestJS & Python Engine

export interface LearnerTierPolicy {
  tier: "MIDDLE_SCHOOL" | "HIGH_SCHOOL" | "EARLY_LEARNER";
  minimumAge: number;
  maximumAge: number;
  interactionMode: "TEXT" | "VOICE_TAP" | "VOICE_TAP_GUIDED";
  freeTextAIEnabled: boolean;
  parentCopilotEnabled: boolean;
  teacherOversight: "FREQUENT" | "MILESTONE";
  humanReviewRequiredForAmbiguousAI: boolean;
}

export interface EarlyLearnerPolicy {
  tier: "EARLY_LEARNER";
  scopeBand: "EARLY_LEARNER_V1"; // Locked to Ages 8-10 / Grades 3-4
  voiceInput: true;
  voiceOutput: true;
  tapInteraction: true;
  freeTextChat: false;
  generativeOpenEndedResponses: false;
  structuredResponsesOnly: true;
  humanReviewOnAmbiguity: true;
  parentCopilot: true;
  shortSessions: true;
  maximumSessionMinutes: 15.0;
  requireGuardianConsent: true;
  retainRawAudio: false;
  retainEphemeralTranscriptsOnly: true;
}

export interface AIPolicyDecision {
  allowed: boolean;
  interactionType: string;
  requiresHumanReview: boolean;
  reason: string;
  policyVersion: string;
}
```

---

## 3. Permitted vs. Prohibited AI Interaction Taxonomies

```
Permitted Interaction Types (EarlyLearnerAIInteraction)
├── GUIDED_QUESTION      -> Pre-approved pedagogical prompt (e.g. "Tap 3 apples.")
├── STRUCTURED_ANSWER    -> Validated option selection confirmation
├── ENCOURAGEMENT        -> Warm, affirming audio chime or verbal praise ("Great try!")
├── HINT                 -> Conceptual clue pointing to visual cue
├── REPEAT_INSTRUCTION   -> Replay of original audio prompt
├── CLARIFICATION        -> Request for child to tap selection
└── HUMAN_HANDOFF        -> Notification routing session to teacher/parent

Prohibited Interaction Types (ProhibitedInteraction) - STRICTLY BLOCKED
├── OPEN_CHAT                     -> Unconstrained conversational dialogue
├── UNSTRUCTURED_ADVICE           -> Medical, nutritional, psychological, or lifestyle advice
├── PERSONAL_DATA_REQUEST         -> Inquiring about child's name, location, family, or school
├── OFF_TOPIC_CONVERSATION        -> Discussion unrelated to target mathematical competency
├── EMOTIONAL_DEPENDENCY_PROMPT   -> Claiming feelings, friendship, love, or emotional attachment
├── ROLEPLAY_OUTSIDE_APPROVED     -> Roleplaying imaginary characters without pedagogical script
└── UNAPPROVED_EXTERNAL_ACTION    -> Triggering web searches, third-party APIs, or device settings
```

---

## 4. Enforcement Implementation & Test Evidence

The policy is implemented in [`phase6/models/early_learner_policy.py`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/phase6/models/early_learner_policy.py) and verified across 12 automated unit and adversarial tests in [`phase6/tests/test_early_learner_policy.py`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/phase6/tests/test_early_learner_policy.py):

- **Age Band Enforcement**:
  - Age 8–10: Validated and granted `EARLY_LEARNER_V1` profile.
  - Age 5 (Kindergarten): Rejected with `AgeGatingError: Age 5 is below Early Learner V1 boundary (8-10). Kindergarten (ages 4-7) is explicitly OUT OF SCOPE for V1.`
  - Age 12: Rejected with `AgeGatingError: Age 12 exceeds Early Learner V1 boundary. Student must be routed to MIDDLE_SCHOOL.`
- **Free-Text Interception**: 100% of unconstrained chat payloads fail closed with `allowed: false`.
- **Prohibited Category Interception**: Parasocial and personal data traps rejected with `requiresHumanReview: true`.
