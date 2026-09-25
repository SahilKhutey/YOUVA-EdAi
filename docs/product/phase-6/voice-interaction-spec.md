# YOUVA EdAI — Phase 6: Voice/Tap Interaction & State Machine Specification
## Minimal-Reading Input Architecture, Speech Pipeline, and Deterministic Interaction States

---

## 1. Input/Output Philosophy: Constrained Interaction

The early learner interface completely eliminates the traditional conversational AI paradigm:

```
UNSAFE CONVERSATIONAL PARADIGM (PROHIBITED)
Child ──> Arbitrary Open Speech ──> Generative LLM ──> Unpredictable Synthetic Speech

SAFE CONSTRAINED PARADIGM (PHASE 6 ARCHITECTURE)
              Child
                │
        ┌───────┴───────┐
        │               │
      SPEAK             TAP
        │               │
       STT          Structured Choice
        │               │
        └───────┬───────┘
                ▼
         Validated Response
                ▼
         Learning Engine (BKT)
                ▼
      Pre-Approved Response Template
                ▼
         TTS / Audio Asset
```

The language model, if utilized internally for phoneme token matching, is **never the final authority** over what audio or visual content the child experiences.

---

## 2. Child Interaction State Machine

Interaction flow is governed by a formal, deterministic finite-state automaton (`ChildInteractionStateMachine`):

```
                   ┌───────────────────┐
                   │   SESSION_START   │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │      WELCOME      │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │    INSTRUCTION    │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │     QUESTION      │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │  CHILD_RESPONSE   │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │    VALIDATION     │
                   └─────┬───────┬─────┘
                         │       │
              (Valid)    │       │   (Ambiguous / Unrecognized)
                         ▼       ▼
       ┌───────────────────┐   ┌─────────────────────────────┐
       │     FEEDBACK      │   │        HUMAN_REVIEW         │
       └─────────┬─────────┘   │  - Enqueue to Teacher Queue │
                 │             │  - Play Static Clarification│
                 │             └──────────────┬──────────────┘
                 │                            │
                 └─────────────┬──────────────┘
                               │
                               ▼
                   ┌───────────────────┐
                   │   NEXT_ACTIVITY   │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ SESSION_COMPLETE  │
                   └───────────────────┘
```

### 2.1 The Ambiguity Routing Invariant
$$\mathbf{Ambiguous\ Input} \longrightarrow \mathbf{Human\ Review\ Queue} + \mathbf{Pre\text{-}Recorded\ Static\ Audio}$$

If a child mumbles, pauses, uses regional dialect words, or speaks unintelligibly:
- **PROHIBITED**: The system must NOT ask an LLM to guess what the child might have meant.
- **MANDATORY**: An `AIReviewItem` is logged with trigger `AMBIGUOUS_SPEECH`, and the interface plays a certified static soundbite: *"Let's try that together! Tap the picture you see on screen."*

---

## 3. Physical UI & Minimal-Reading Layout

1. **Touch Target Dimensions**:
   - Minimum button dimension: **$64 \times 64\text{ dp}$** (conforming to WCAG AAA motor control standards for primary learners).
   - High inter-button margin ($24\text{ dp}$) to prevent accidental adjacent mis-taps.
2. **Audio-First Scaffolding**:
   - Every on-screen prompt is accompanied by an auto-playing or re-playable spoken audio clip recorded at a calm, natural pace (110–130 words per minute).
   - Text is limited to a maximum of 8 words in large, high-contrast sans-serif font (Lexend / Comic Neue).
3. **Non-Punitive Visual Feedback**:
   - Correct responses trigger a cheerful, gentle chime and sparkling star animation.
   - Incorrect attempts trigger a neutral, supportive sound and visual hint shake: no red crossbars, buzzer sounds, or negative score deductions.

---

## 4. Speech-to-Text (STT) & Audio Minimization Pipeline

```
[Microphone Ingestion (Web Audio API)]
               │
               ▼
[Volatile RAM Buffer] ──> (Max 5.0s PCM chunk; NEVER written to persistent storage)
               │
               ▼
[Constrained Phonetic Matcher]
   ├── Matches against expected answer vocabulary (e.g. "three", "triangle", "more")
   └── Computes acoustic confidence score C in [0.0, 1.0]
               │
       ┌───────┴───────┐
    C >= 0.85       C < 0.85
       │               │
       ▼               ▼
  [Structured      [Ambiguous Speech
    Match]          Event -> Human Review Queue]
       │               │
       └───────┬───────┘
               ▼
[Memory Buffer Purged & Overwritten Immediately]
```
- **Zero Raw Audio Storage**: Raw microphone bytes are zeroed out in RAM immediately following transcription.
- **Latency Requirement**: Processing pipeline from speech end-of-utterance to feedback audio cue is capped at $< 450\text{ms}$.
