# YOUVA EdAI — Phase 8: Capability CAP-001 Deep Dive
## Adaptive Hint Disclosure Tiering: Scaffolding Bounds, Efficacy, and Failure Modes

---

## 1. Executive Summary & Pedagogical Context

`CAP-001` is the flagship bounded autonomous capability within YOUVA EdAI. It governs how the AI assistant provides dynamic, progressive hints to middle and high school students during independent practice sessions.

Its primary pedagogical objective is to **encourage productive struggle without triggering cognitive exhaustion or answer-giveaway**.

---

## 2. Three-Tier Progressive Disclosure Architecture

`CAP-001` enforces a strict 3-tier scaffolding progression:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CONCEPTUAL NUDGE (Directional Orientation)                     │
│ Prompt: "What concept or formula relates the given values?"            │
│ Target: Re-orient student focus to core prerequisite knowledge.       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Student requests further help
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: METHODOLOGICAL SCAFFOLD (Strategy & Process Guidance)          │
│ Prompt: "Try collecting all variable terms on one side of the equals." │
│ Target: Outline the intermediate problem-solving step.                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Student remains stuck
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 3: CONCRETE WORKED STEP (Arithmetic / Specific Calculation)        │
│ Prompt: "Subtract 3x from both sides to get 2x + 4 = 10."              │
│ Target: Execute the immediate next sub-step; NEVER reveal final answer.│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict Autonomous Bounds & Constraints

1. **Step Sizing (`maxStepSize: 1.0`):**
   - The AI can advance the hint tier by at most `+1` per request.
   - It cannot jump from Tier 1 directly to Tier 3.
   - Any attempt to jump tiers raises `ActionOutOfBoundsError`.
2. **Answer Concealment Invariant:**
   - Tier 3 hints must never output the terminal solution or multiple-choice answer letter.
   - Scanned via regex and teacher verification heuristics.
3. **Session Rate Limiting:**
   - Cooldown period of 10 seconds between hint requests to prevent button mashing.
   - Maximum of 3 hints per practice problem.
4. **Fallback Mechanism:**
   - If external LLMs are unavailable, `LLMProviderGateway` retrieves pre-computed deterministic hints from `DeterministicCurriculumFallback` with zero degradation of student experience.

---

## 4. Telemetry Metrics & Monitoring Policy

Telemetry stream evaluated continuously by `ModelDriftMonitor`:
- `hintHelpfulness`: Student self-rating or success on subsequent attempt (Target \(\ge 0.88\)).
- `safetyScore`: Content appropriateness for minors under DPDP / COPPA (Target \(\ge 0.99\)).
- `teacherOverrideRate`: Frequency of teachers disabling or editing hints (Target \(\le 0.05\)).
