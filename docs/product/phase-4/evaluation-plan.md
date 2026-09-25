# YOUVA EdAI — Phase 4 Personalization Evaluation Plan

**Plan Version:** 1.0  
**Phase:** Phase 4 — Personalization Depth  
**Methodological Invariant:** Do not interpret simple correlation as causation. For classroom pilots, findings must be characterized as *directional evidence* rather than absolute proof of pedagogical superiority.

---

## 1. Feature Hypothesis & Evaluation Matrix (Cycle 8)

Success criteria are defined prior to deployment. Every personalization heuristic must prove measurable utility over the Phase 1–3 baseline:

| Feature / Heuristic | Hypothesis | Core Measurement Metric | Baseline (Phase 3) | Target (Personalized) | Decision Rule |
|---|---|---|:---:|:---:|---|
| **Misconception Tagging & Prerequisite Reteach** | Halting practice to reteach weak prerequisites reduces repeated errors. | Repeated-error rate on negative transpositions | 38.4% | $< 20.0\%$ | If repeated errors drop by $\ge 15\%$, **KEEP**; otherwise **MODIFY**. |
| **Response-Time Velocity Detection** | Detecting rapid guessing ($< 4s$) and prompting scratchpad work improves accuracy. | Post-prompt correctness on next attempt | 28.0% | $> 50.0\%$ | If post-prompt accuracy exceeds $50\%$, **KEEP**; otherwise **REMOVE**. |
| **Alternate Visual Explanations** | Offering visual balance models when symbolic explanations fail improves recovery. | Post-explanation correctness on identical difficulty | 44.0% | $> 65.0\%$ | If visual model improves recovery by $\ge 20\%$, **KEEP**; otherwise **MODIFY**. |
| **Spaced Retrieval Intervals** | Automated $1d \to 3d \to 7d$ review prompts maintain long-term retention. | Day-14 retention assessment score | 61.0% | $> 75.0\%$ | If retention increases by $\ge 10\%$, **KEEP**; otherwise **MODIFY**. |

---

## 2. Experimental Execution Framework

1. **A/B Cohort Split (Within Classroom):**
   - 15 students assigned to **Group A (Baseline Engine: `PERSONALIZATION_ENABLED=false`)**.
   - 15 students assigned to **Group B (Personalized Engine: `PERSONALIZATION_ENABLED=true`)**.
2. **Pedagogical Parity:** Both groups practice the identical NCERT Chapter 2 curriculum under Smt. Sen's supervision.
3. **Data Integrity:** Identical telemetry events (`response_submitted`, `mastery_updated`) captured across both cohorts.
4. **Teacher Oversight:** Smt. Sen maintains identical override authority across both groups.
