# YOUVA-EdAi: Phase 4 Personalization Depth Specification

## 1. Executive Summary
Phase 4 deepens pedagogical personalization in YOUVA-EdAi without resorting to speculative pseudo-scientific profiling. The system replaces ungrounded heuristics ("cognitive twin", "learning style heuristics", "emotional valence guessing") with empirical, psychometrically validated learning mechanisms:
1. **Prerequisite Concept Directed Acyclic Graph (DAG)** with strict cycle detection and backward remediation tracing.
2. **3-Tier Adaptive Hint Scaffolding** providing non-punitive, progressive assistance with calibrated Bayesian Knowledge Tracing (BKT) parameter adjustments.
3. **Student Mistake Taxonomy & Diagnostic Feedback** classifying errors into 5 canonical algebraic categories and delivering actionable instructional feedback.
4. **Educator Override Pattern Review Loop** capturing teacher adjustments to identify concept miscalibrations while preserving human authority.

---

## 2. Core Components

### 2.1 Concept DAG Engine
- **Acyclicity Guarantee**: The curriculum dependency graph is validated via Tarjan/DFS cycle detection. No circular prerequisites are permitted.
- **Topological Sorting**: Kahn's algorithm computes the linear sequence of concept mastery.
- **Backward Remediation Tracer**: If a student demonstrates deficits on an advanced concept ($P(L_t) < 0.85$), the tracer traverses upstream prerequisite nodes to isolate foundational gaps.
- **Zone of Proximal Development (ZPD) Frontier**: Calculates the subset of concepts where all direct prerequisites are mastered ($P(L) \ge 0.85$), but the concept itself is unmastered.

### 2.2 3-Tier Progressive Hint Scaffolding
- **Tier 1 (Conceptual Cue)**: High-level pedagogical prompt reminding the student of the governing mathematical property (e.g., equality balance).
- **Tier 2 (Strategic Step)**: Actionable problem-solving step decomposing the immediate operation (e.g., add 3 to both sides).
- **Tier 3 (Concrete Execution)**: Step-by-step arithmetic and algebraic walk-through.
- **Progressive Disclosure**: Accessing hints is strictly sequential. Jumping directly to Tier 3 without reviewing Tiers 1 and 2 is rejected.
- **BKT Evidence Discounting**:
  $$\hat{P}(G) = \min\left(0.90, P(G) + (1 - P(G)) \times \text{penalty}\right)$$
  Prevents assisted answers from artificially inflating mastery estimates.

### 2.3 Student Mistake Taxonomy
Errors in algebraic reasoning are categorized into 5 empirical buckets:
1. `SIGN_ERROR`: Sign reversal or transposition slip across equality operators.
2. `DISTRIBUTIVE_ERROR`: Multiplication omitted on inner parenthesis terms ($a(b+c) \ne ab+c$).
3. `COMBINING_LIKE_TERMS_ERROR`: Merging incompatible variables and scalar constants ($3x + 4 \ne 7x$).
4. `FRACTION_CLEARANCE_ERROR`: Clearing denominator without multiplying all terms by the LCM.
5. `ARITHMETIC_ERROR`: Elementary calculation slip during intermediate steps.

### 2.4 Educator Override Pattern Review Loop
- AI proposes recommendations; educators maintain permanent override authority.
- Telemetry logs override reasons: `DIFFICULTY_TOO_HIGH`, `DIFFICULTY_TOO_LOW`, `PACING_ALIGNMENT`, `STUDENT_ANXIETY`, `OTHER`.
- When override frequency on a concept crosses threshold ($N \ge 3$), a calibration recommendation is triggered for psychometric recalibration.
