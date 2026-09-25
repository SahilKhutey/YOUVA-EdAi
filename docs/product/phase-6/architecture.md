# YOUVA EdAI — Phase 6: Early Learner Technical Architecture
## Constrained Execution Environment, Tripartite Safety Boundaries, and Shared Platform Integration

---

## 1. High-Level Architectural Topology

The Early Learner architecture is engineered as a **Constrained Execution Environment (CEE)**. Rather than treating early childhood as another parameter in a monolithic web app, the child-facing surface is wrapped in three concentric isolation boundaries:

```
                            YOUVA EdAI Platform
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
      Shared Platform                                    Tier Policy
   (Identity, VPC Consent,                         ┌─────────┼──────────┐
    BKT Core, Audit Chain)                         ▼         ▼          ▼
             │                                   Middle    High    Early Learner
             │                                   School   School        │
             │                                                    ┌─────┴─────┐
             │                                                    ▼           ▼
             │                                              EARLY_LEARNER_V1 Kindergarten
             │                                              (Ages 8-10)    (Future Lock)
             │                                                    │
             ▼                                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            EARLY LEARNER CONSTRAINED EXECUTION ENVIRONMENT             │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ 1. Interaction      │ 2. AI Policy              │ 3. Supervision       │
│    Boundary         │    Boundary               │    Boundary          │
├─────────────────────┼───────────────────────────┼──────────────────────┤
│ - Voice/Tap Only    │ - Zero Open-Ended Chat    │ - Parent Co-Pilot    │
│ - Minimal Reading   │ - Hard Block Lists        │ - Unilateral Pause   │
│ - Audio-First Assets│ - Ambiguity -> Queue      │ - Non-Surveillance   │
│ - 15m Screen Cap    │ - No Generative LLM Direct│   Family Digest      │
└─────────────────────┴───────────────────────────┴──────────────────────┘
                                     │
                                     ▼
                        Shared Learning Core (BKT)
                                     │
                                     ▼
                        Teacher / Parent Visibility
```

---

## 2. The Three Concentric Isolation Boundaries

### Boundary 1: Interaction Boundary
- **Input Channels**: Touch tap on calibrated visual targets (minimum 64x64px touch target) and short spoken utterance via Web Audio API.
- **Output Channels**: High-fidelity spoken audio prompts (`promptAudio`), tactile visual feedback animations (gentle pulse, cheerful non-startling chimes), and minimal written text (Flesch-Kincaid Grade Level $\le 1.0$, max 8 words per prompt).
- **Physical Safety Guard**: Hard technical session cutoff at 15 minutes (`ScreenTimeLimitExceededError`).

### Boundary 2: AI Policy Boundary
- **Zero Generative Open Chat**: The child never communicates directly with a Large Language Model.
- **Deterministic State Transition**: Child interaction follows `ChildInteractionStateMachine`:
  $$\text{SESSION\_START} \to \text{WELCOME} \to \text{INSTRUCTION} \to \text{QUESTION} \to \text{CHILD\_RESPONSE} \to \text{VALIDATION}$$
- **Ambiguity Routing**: If child speech is unrecognized or phonetically ambiguous, the system **NEVER allows an LLM to guess what the child meant**. It routes immediately to `HUMAN_REVIEW` and plays a static, pre-recorded audio clarification (`"Let's try that again together!"`).

### Boundary 3: Supervision Boundary (Parent Co-Pilot)
- **Real-Time Mirroring**: The parent receives an instantaneous WebSocket mirror of all audio prompts and child responses on their companion device.
- **Unilateral Parental Interventions**:
  - `PAUSE`: Freezes learning session immediately.
  - `TERMINATE`: Instantly drops WebSocket connection and closes child screen.
  - `CO_PLAY_HINT`: Parent can transmit gentle suggested hints to support their child.
- **Non-Surveillance Parent Digest**: Summarizes accomplishments in affirming developmental language rather than statistical error distributions.

---

## 3. Data Flow: Child Response to Knowledge State

```
[Child Taps or Speaks]
           │
           ▼
[Input Validation Layer]
   ├── STT processes audio in volatile memory (No raw audio stored)
   └── Validates against certified prompt choices
           │
       ┌───┴───┐
     Valid   Ambiguous
       │       │
       │       ▼
       │   [Human Review Queue Manager]
       │   [Play Pre-Recorded Static Clarification Audio]
       ▼
[Corbett & Anderson BKT Update Engine]
   ├── Prior parameters: P(G) = 0.33, P(S) = 0.15, P(T) = 0.10
   └── Updates P(L) for foundational competency (e.g. NUM-EARLY-01)
           │
           ▼
[Real-Time State Notification]
   ├── Ephemeral transcript mirrored to Parent Co-Pilot
   └── Append-only HMAC log records formative completion
```
