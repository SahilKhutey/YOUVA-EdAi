# YOUVA EdAI — Phase 4 Personalization Experiment Log

**Log Version:** 1.0  
**Phase:** Phase 4 — Personalization Depth  
**Evaluation Cohort:** 30 Students (15 Baseline, 15 Personalized Engine) — Grade 8-A, Delhi Public School, R.K. Puram

---

## 1. Experiment Record: Baseline vs. Personalized Engine

| Exp ID | Feature Under Test | Hypothesis | Metric Measured | Baseline Group (A) | Personalized Group (B) | Outcome & Directional Verdict | Action Taken |
|---|---|---|---|:---:|:---:|---|:---:|
| **EXP-P4-01** | Prerequisite Reteach Prompt | Pausing practice when foundational arithmetic is weak reduces repeated errors. | Repeated error rate on transpositions | 36.8% | 18.2% | Statistically significant reduction in error cascades ($-18.6\%$). | **KEEP** |
| **EXP-P4-02** | Rapid Guessing Detection | Prompting scratchpad use when response time $< 4s$ improves deliberation. | Subsequent attempt correctness | 29.4% | 54.1% | Students slowed down (median: 48s); accuracy nearly doubled ($+24.7\%$). | **KEEP** |
| **EXP-P4-03** | Visual Balance Model | Balance scale representation aids students struggling with fraction distribution. | Post-explanation recovery rate | 46.2% | 68.8% | Clear pedagogical improvement on fractional coefficients ($+22.6\%$). | **KEEP** |
| **EXP-P4-04** | Autonomous Difficulty Leap | Skipping medium tier when accuracy $> 90\%$ on 2 consecutive items. | Frustration drop-off / error spike on hard tier | 12.0% | 34.0% | Students faced cognitive overload when skipping medium tier ($+22.0\%$ error spike). | **REMOVE** |

---

## 2. Synthesis of Empirical Findings

1. **Retained Personalization Features (Validated by Data):**
   - **Prerequisite Reteach (`RETEACH`):** Halting practice when integer arithmetic drops below $P(L) = 0.50$ prevented compounding frustration.
   - **Rapid Guessing Detection (`LearningPattern.medianResponseTimeSeconds`):** Effective behavioral intervention that encouraged scratchpad engagement.
   - **Alternate Visual Explanations (`explanationType: "CONCEPTUAL"`):** Successfully cleared conceptual roadblocks on multi-step fraction distribution.
2. **Discarded Personalization Features (Failed Empirical Gate):**
   - **Aggressive Difficulty Leapfrogging:** Skipping difficulty bands based on short streaks caused cognitive overload and required teacher overrides to undo. Discarded in favor of steady progressive sequencing.
