# YOUVA EdAI — Phase 4 Cognitive Model v1 Specification

**Specification Version:** 1.0  
**Phase State:** WORKING BASELINE  
**Governing Standard:** Empirical behavioral signals only; zero unsupported psychological categorization.

---

## 1. Operating Epistemic Principle

> [!CAUTION]
> **PROHIBITION AGAINST CATEGORICAL INFERENCES:**
> The cognitive model must **never** assert unsupported psychological labels such as:
> *"This student is a visual learner"* or *"This student has low natural aptitude."*
> Educational science has repeatedly debunked "learning styles" as ungrounded pseudoscience.
> 
> Instead, the model outputs strictly operational, observable, evidence-backed observations:
> **"Step-by-step algebraic breakdowns were followed by 40% fewer sign transposition errors in the student's recent practice sessions."**

---

## 2. LearningPattern Data Model (Cycle 3)

The cognitive model in Phase 4 is grounded strictly in signals validated by the Phase 3 pilot telemetry:

```typescript
export interface LearningPattern {
  studentId: string;

  // 1. Response-Time Velocity
  // Distinguishes between rapid guessing (< 4s) and thoughtful multi-step scratchpad effort (30-90s)
  medianResponseTimeSeconds: number | null;

  // 2. Recent Error Rate
  // Rolling error rate over the last 10 practice trials (0.0 to 1.0)
  recentErrorRate: number;

  // 3. Repeated / Persistent Error Rate
  // Frequency of repeating the exact same error type (e.g. sign transposition) consecutively
  repeatedErrorRate: number;

  // 4. Hint Responsiveness (Scaffolding Conversion)
  // Percentage of instances where viewing a Tier 1 or Tier 2 hint led to a correct next submission
  hintSuccessRate: number | null;

  // 5. Operational Explanation Preference
  // Inferred strictly from post-explanation correctness, not self-reported surveys
  preferredExplanationType:
    | "STEP_BY_STEP"    // Algebraic line-by-line derivation
    | "EXAMPLE_FIRST"   // Parallel numerical worked example
    | "CONCEPTUAL"      // Visual balance / geometric scale model
    | "UNKNOWN";        // Default when insufficient data exists (< 5 trials)

  updatedAt: string; // ISO 8601 UTC
}
```

---

## 3. Signal Inference Rules

1. **Rapid Guessing Detection:**
   - If `responseTime < 4.0 seconds` on an unsolved multi-step equation:
   - *Signal:* Do not penalize BKT $P(L)$ as severely for lack of skill; instead, trigger a prompt: *"Take your time to write down step 1 on your scratchpad."*
2. **Persistent Misconception Detection:**
   - If `repeatedErrorRate >= 0.50` on negative coefficients:
   - *Signal:* Candidate for `RETEACH` recommendation; surface specific misconception tag to teacher.
3. **Scaffolding Efficacy:**
   - If `hintSuccessRate >= 0.75`:
   - *Signal:* Student benefits from light Socratic hints; do not reveal full worked solutions prematurely.
