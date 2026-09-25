# YOUVA EdAI — Phase 3 Minimal-Necessary Instrumentation Specification

**Data Contract Version:** 1.0  
**Governing Standard:** Digital Personal Data Protection Act 2023 (Section 9 Data Minimization Mandate)

---

## 1. Core Event Schema

The pilot instrumentation is intentionally minimal. It records only the exact events required to answer the pilot's pedagogical and trust research questions.

```typescript
export type PilotEvent =
  | "diagnostic_started"
  | "diagnostic_completed"
  | "practice_started"
  | "item_presented"
  | "response_submitted"
  | "mastery_updated"
  | "practice_completed"
  | "teacher_recommendation_viewed"
  | "teacher_override_created"
  | "safety_incident_opened"
  | "safety_incident_resolved";

export interface PilotTelemetryPayload {
  eventId: string;
  eventType: PilotEvent;
  timestamp: string; // ISO 8601 UTC
  cohortId: string;  // e.g. "PILOT-DPS-RKP-2026-Q3"
  actorId: string;   // Pseudonymized Student or Teacher ID
  sessionId?: string;
  conceptId?: string;
  itemId?: string;
  metadata?: {
    isCorrect?: boolean;
    hintTierUsed?: number; // 0, 1, 2, or 3
    priorMastery?: number; // P(L_{t-1})
    newMastery?: number;   // P(L_t)
    recommendationReason?: string;
    overrideAction?: string;
    overrideRationale?: string;
    safetySeverity?: string;
  };
}
```

---

## 2. Derived Pedagogical & Trust Measures

The following derived metrics are computed strictly from the core event stream:
1. **Diagnostic Completion Rate:** Percentage of enrolled students who complete all 10 diagnostic items.
2. **Practice Participation & Completion:** Active practice sessions initiated vs. completed without abandonment.
3. **Return Frequency (Session Cadence):** Number of distinct days per week a student initiates practice.
4. **Concept Mastery Velocity:** $\Delta P(L) = P(L_{\text{final}}) - P(L_{\text{baseline}})$ per concept.
5. **Teacher Recommendation Acceptance Rate:** $\frac{\text{Accepted Recommendations}}{\text{Viewed Recommendations}}$.
6. **Teacher Override Frequency:** Count of manual teacher state/recommendation overrides per week.
7. **Teacher Override Direction:** Upward calibration (marking student higher than AI) vs. Downward calibration (marking student lower/flagging for remediation).
8. **Content Issue Frequency:** Count of flagged question bugs or ambiguities per 100 practice trials.
9. **Safety Incident Rate:** Count of safety escalations opened and resolved.

---

## 3. Strict Data Boundary Lists

### 3.1 What We COLLECT (Approved Pilot Scope)
- Pseudonymized student ID and teacher ID.
- Start and end timestamps of learning sessions.
- Question IDs attempted, answers submitted, and correctness.
- Hint tiers revealed (Tier 1 clue, Tier 2 breakdown, Tier 3 solution step).
- Pre- and post-attempt BKT mastery probabilities ($P(L)$).
- Teacher recommendation views, actions, and written override rationales.
- Safety incident categories, severity classifications, and human resolution notes.

### 3.2 What We DO NOT COLLECT (Explicitly Prohibited)
- **NO Continuous Video / Camera Feeds:** No webcam capture, eye-tracking, gaze estimation, or facial expression analysis.
- **NO Audio / Ambient Microphone Recordings:** No room audio or continuous speech monitoring.
- **NO Keystroke Dynamics or Biometrics:** No typing cadence, pressure modeling, or biometric identification.
- **NO Off-Platform / Cross-App Activity:** No browser history, background process monitoring, or device scanning.
- **NO Free-Form Personal Chat Logs:** No unconstrained open-domain dialogue; all interactions are anchored to equation scratchpad and guided Socratic hints.
- **NO Demographic Profiling:** No income, religion, caste, geolocation tracking, or targeted advertising identifiers.
