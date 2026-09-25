# YOUVA EdAI — Phase 6: Human Review Queue Specification
## Architecture, Escalation Protocols, and Human-Only Item Resolution Invariant

---

## 1. Architectural Mandate & Non-Negotiables

When an early learner encounters ambiguity, speech recognition failure, or an edge-case safety signal, automated systems must never be permitted to make independent safety determinations:

```
[Ambiguous Speech / Blocked Event / Safety Signal]
                         │
                         ▼
             [Incident / Review Event]
                         │
                         ▼
             [Human Review Queue Manager]
                         │
                         ▼
             [Teacher / Safety Officer Review]
                         │
                 ┌───────┴───────┐
                 ▼               ▼
        [Approved Response]   [Pedagogical Escalation]
                 │               │
                 └───────┬───────┘
                         ▼
             [Immutable Audit Event (HMAC)]
```

### Core Invariant
$$\mathbf{AI\ Agents\ CANNOT\ Resolve\ Human\ Review\ Items}$$
Any API request or background worker attempting to update an `AIReviewItem` status to `RESOLVED` where `reviewerRole` is automated (e.g. `ai`, `ai_agent`, `bot`) is rejected server-side with `PolicyViolationError`.

---

## 2. Review Queue Data Model (`AIReviewItem`)

```typescript
export interface AIReviewItem {
  id: string;                      // Unique identifier: "rev_<12-hex-chars>"
  studentSessionId: string;        // Active session ID
  interactionId: string;           // Step index within session
  trigger: 
    | "AMBIGUOUS_SPEECH"
    | "POLICY_BLOCK"
    | "CONTENT_FILTER"
    | "SAFETY_SIGNAL"
    | "SYSTEM_ERROR";
  inputClassification: string;     // e.g. "CHILD_SPEECH_UNRECOGNIZED"
  recommendedAction: string;       // e.g. "PLAY_STATIC_REPEAT_INSTRUCTION_AUDIO"
  status: 
    | "OPEN"
    | "ACKNOWLEDGED"
    | "REVIEWED"
    | "RESOLVED";
  reviewerId: string | null;       // Human staff ID: "tch_sharma_99"
  createdAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;  // Mandatory explanatory text for audit
}
```

---

## 3. Escalation Triggers & Operational SLAs

| Trigger Classification | Description | Automatic Client Action | Review SLA | Assigned Reviewer |
|---|---|---|---|---|
| `AMBIGUOUS_SPEECH` | Child utterance confidence $< 0.85$ or acoustic mismatch | Play static clarification audio; switch to visual tap mode | 24 Hours | Classroom Teacher |
| `POLICY_BLOCK` | Child or external input attempted forbidden keyword | Drop prompt; return certified neutral response | 4 Hours | Safety Reviewer |
| `CONTENT_FILTER` | Prompt exceeded 8 words or contained dark pattern | Immediate prompt delivery halt | Immediate | Lead Content Editor |
| `SAFETY_SIGNAL` | Distress keyword, repeated silence, or parent panic kill switch | Session immediately paused; parent notified | 1 Hour | Child Safety Officer |
| `SYSTEM_ERROR` | Audio streaming drop or STT service failure | Fallback to offline local asset bank | 12 Hours | System Reliability Team |

---

## 4. Teacher Cockpit Integration & Audit Logging

- **Cockpit View**: The review queue is rendered as an alert drawer in the Primary Teacher Cockpit (`frontend/app/teacher/primary/review-queue`).
- **Resolution Flow**:
  1. Teacher listens to anonymized playback buffer (if preserved for session duration) or inspects phonetic transcript.
  2. Teacher classifies the event (e.g. *"Dialect variation in number pronunciation"*).
  3. Teacher selects resolution action (*"Add synonym to local classroom lexicon"* or *"Dismiss as background noise"*).
  4. Server logs an append-only event with teacher ID and HMAC signature into PostgreSQL audit table `EarlyLearnerReviewAuditLog`.
