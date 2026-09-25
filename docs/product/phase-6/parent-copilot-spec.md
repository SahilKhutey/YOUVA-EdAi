# YOUVA EdAI — Phase 6: Parent Co-Pilot Specification
## Real-Time Supervision, Non-Surveillance Family Digests, and Session Participation Modes

---

## 1. Design Philosophy: Accompaniment vs. Surveillance

In secondary education, parental dashboards often resemble academic surveillance systems: tracking test scores, error rates, and dwell times. In early childhood education, exposing raw statistical metrics causes parental anxiety, punitive home pressure, and toxic comparison.

```
PUNITIVE SURVEILLANCE PARADIGM (AVOIDED)
┌────────────────────────────────────────────────────────┐
│ BKT Probability P(L) = 0.73                            │
│ Repeated Error Rate = 21%                              │
│ Average Solve Latency = 8.4 seconds                    │
│ "Your child is in the bottom 30th percentile in math." │
└────────────────────────────────────────────────────────┘

SUPPORTIVE ACCOMPANIMENT PARADIGM (PHASE 6 ARCHITECTURE)
┌────────────────────────────────────────────────────────┐
│ Activity Completed: Counting & Grouping Numbers 1 to 10│
│ Progress: Completed 4 playful activities together.     │
│ Observation: Enjoyed working with gentle hints on one  │
│              activity. Great persistence!              │
│ Home Play Idea: Count everyday objects (spoons, blocks)│
│                 during snack time.                     │
└────────────────────────────────────────────────────────┘
```

The underlying BKT probabilities and psychometric parameters remain strictly confined to teacher and institutional analytics.

---

## 2. Session Participation Modes

Session participation is modeled as a first-class domain attribute (`SessionParticipationMode`):

```typescript
export type SessionParticipationMode =
  | "CHILD_ONLY"           // Child engages independently with teacher oversight
  | "PARENT_ASSISTED"      // Parent accompanies child during session (Default for V1)
  | "TEACHER_SUPERVISED";  // Small-group lab setting led by classroom teacher
```

### 2.1 Research & Evaluation Utility
Explicitly tagging each session with its participation mode enables educational researchers to isolate whether learning velocity differences stem from algorithmic adaptation or parental co-presence, without needing to rewrite data schemas in future phases.

---

## 3. Real-Time Parent Co-Pilot Companion Controls

During an active session, the parent companion screen provides real-time situational awareness and unilateral control:

```
┌────────────────────────────────────────────────────────────────────────┐
│ YOUVA Parent Co-Pilot — Live Session: Aarav (Age 8)                   │
├────────────────────────────────────────────────────────────────────────┤
│ Session Duration: 06:42 / 15:00 [████████░░░░░░░░░░░]                  │
│ Status: ACTIVE (Mode: PARENT_ASSISTED)                                 │
├────────────────────────────────────────────────────────────────────────┤
│ Live Transcript Mirror:                                                │
│ [06:15] Audio: "Can you tap the group with 4 apples?"                  │
│ [06:22] Child: [Tapped group 4] -> Correct! (Gentle chime played)      │
│ [06:30] Audio: "Now, which group has more than 5 stars?"               │
├────────────────────────────────────────────────────────────────────────┤
│ Parental Intervention Controls:                                        │
│ [ ⏸️ PAUSE SESSION ]  [ 🛑 EMERGENCY STOP ]  [ 💡 SUGGEST CO-PLAY HINT ]│
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Unilateral Parental Override Actions
- **Pause (`PAUSE`)**: Instantly freezes the child's screen and pauses audio narration. Used when family interruptions occur (e.g. snack time, doorbell).
- **Emergency Stop (`TERMINATE`)**: Unilateral kill switch. Drops WebSocket connection, aborts session, marks session `TERMINATED_BY_PARENT`, and closes child screen.
- **Co-Play Hint (`CO_PLAY_HINT_OFFERED`)**: Allows the parent to trigger a gentle visual sparkle or spoken hint to assist a stuck child without physical device snatching.

---

## 4. Post-Session Parent Digest Architecture

Upon session completion or 15-minute timeout, `ParentCopilotSession.generate_parent_digest()` transforms session logs into a warm, constructive summary:

```typescript
export interface ParentDigest {
  sessionId: string;
  childToken: string;
  sessionDate: string;
  summaryText: string;
  activitiesCompleted: number;
  strengthsObserved: string[];
  suggestedHomeActivities: string[];
  totalDurationMinutes: number;
}
```

### Verification Guarantee
Unit tests in [`test_early_learner_policy.py`](file:///c:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/phase6/tests/test_early_learner_policy.py) explicitly verify that `digest.summaryText` contains **zero occurrences of `P(L)` or `%`**, preventing raw statistical leakage into family communications.
