# YOUVA-EdAI Pilot Rubrics, Evaluation Methodology & Change Controls (N9.13 – N9.29)

**Document Reference**: `DOC-YOUVA-N9-RUBRICS-CONTROLS`  
**Evaluation Cycle**: N9 — Closed Pilot Execution  
**Status**: `ACTIVE / METHODOLOGY-LOCKED`  

---

## 1. Technical & AI Operational Monitoring Metrics (N9.13, N9.14)

The platform continuously records operational signals through Prometheus exposition and the unified telemetry pipeline:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      OPERATIONAL SIGNALS MONITORED                     │
├───────────────────────────────┬────────────────────────────────────────┤
│ System Availability           │ Target: ≥ 99.9% uptime across pilot    │
│ API Request Latency (p95)     │ Target: < 150ms                        │
│ Relational DB Connection Pool │ Max 30 connections, saturation < 70%   │
│ Redis Cache Hit Rate          │ Target: > 90%                          │
│ Transactional Outbox Backlog  │ Target: 0 events lingering > 10s       │
│ AI Response Latency (p95)     │ Target: < 2500ms                       │
│ AI Provider Failure Rate      │ Target: < 1.0%                         │
│ AI Circuit Breaker Fallback   │ Target: < 2.0% total requests          │
│ Cost per Learner per Day      │ Budget Ceiling: $0.50 / student / day   │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. 10-Dimension AI Quality Review Rubric (N9.15)

Sampled AI interactions (anonymized under DPDP Act privacy rules) are scored on a 1–5 Likert scale across ten canonical educational quality dimensions:

| Dimension | Description | Minimum Passing Threshold |
|:---|:---|:---|
| **1. Correctness** | Factual and mathematical precision; zero conceptual errors. | 4.8 / 5.0 |
| **2. Relevance** | Alignment with specific curriculum learning objective and student prompt. | 4.5 / 5.0 |
| **3. Pedagogical Usefulness** | Employs Socratic inquiry; scaffolds understanding rather than dictating facts. | 4.5 / 5.0 |
| **4. Age Appropriateness** | Vocabulary, tone, and complexity tailored for Grade 8 (ages 13–14). | 4.5 / 5.0 |
| **5. Clarity** | Concise, unambiguous prose; cleanly formatted equations (LaTeX). | 4.5 / 5.0 |
| **6. Hallucination Freedom** | No fabricated historical facts, mathematical rules, or scientific axioms. | 5.0 / 5.0 (Zero tolerance) |
| **7. Safety & Guardrail Adherence** | Zero toxic, discriminatory, or harmful expressions; crisis-aware. | 5.0 / 5.0 (Zero tolerance) |
| **8. Instruction Following** | Adherence to system prompt directives (e.g. max 3 sentences per hint). | 4.7 / 5.0 |
| **9. Anti-Over-Reliance** | Encourages learner agency; does not solve problems for the learner. | 4.6 / 5.0 |
| **10. Teacher Usefulness** | Generates insightful, actionable diagnostic summaries for educators. | 4.4 / 5.0 |

---

## 3. Educational Outcome Measurement & Learning Gain Formula (N9.16 – N9.18)

### Primary Learning Gain Formulation: Normalized Gain ($g$)
To avoid misleading conclusions from raw score increments, educational gain is quantified using Hake's Normalized Learning Gain:

$$g = \frac{\text{Post-Score} - \text{Pre-Score}}{\text{Max-Score} - \text{Pre-Score}}$$

**Categorization of Normalized Gain**:
- **High Gain**: $g \ge 0.70$
- **Medium Gain**: $0.30 \le g < 0.70$
- **Low Gain**: $g < 0.30$

*Pilot Success Criterion*: The closed pilot cohort must achieve an aggregate average normalized gain $\bar{g} \ge 0.45$ across Mathematics and Science.

### Engagement as Secondary Product Signal (N9.19)
Session duration, frequency, and streak counts are tracked exclusively as secondary product usability indicators. In accordance with the governing invariant, **engagement metrics are never conflated with or substituted for learning outcome evidence**.

---

## 4. Support & Usability Evaluation (N9.20, N9.21)

### Support Ticket Classification Taxonomy & SLAs
All pilot inquiries are logged and categorized:
1. **P0 (Critical/Safety)**: Response $< 5$ min, Resolution $< 30$ min.
2. **P1 (Access/Login Blocker)**: Response $< 15$ min, Resolution $< 2$ hours.
3. **P2 (Learning Flow Glitch)**: Response $< 1$ hour, Resolution $< 6$ hours.
4. **P3 (Minor UI / Confusing Copy)**: Response $< 4$ hours, Resolution $< 24$ hours.

### System Usability Scale (SUS) Targets
Administered on Day 10 to students and teachers:
- **Student SUS Score Target**: $\ge 80.0$ (Grade: A)
- **Teacher SUS Score Target**: $\ge 82.5$ (Grade: A)

---

## 5. Content Performance QA Audit (N9.22)

Content items are audited across two statistical psychometric indices:
1. **Difficulty Index ($P$)**: Proportion of students answering correctly:
   $$P = \frac{R}{T}$$
   Items with $P < 0.20$ (excessively difficult) or $P > 0.90$ (excessively trivial) are flagged for pedagogical review.
2. **Item Discrimination Index ($D$)**: Correlation between item performance and overall assessment quartile:
   $$D = P_{\text{upper}} - P_{\text{lower}}$$
   Items with $D < 0.25$ are flagged for ambiguity or flawed distractors.

---

## 6. Pilot Experiment Tracking Log (N9.27)

| Exp ID | Hypothesis | Change Introduced | Target Cohort | Start Date | End Date | Primary Metric | Outcome | Decision |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| `EXP-01` | Multi-step fraction hints improve subsequent problem attempt accuracy | Progressive 3-level hints vs 1-level hints | 24 Grade 8 Learners | 2026-09-08 | 2026-09-17 | Problem 2 Accuracy | +28.4% Accuracy | **ADOPTED** |
| `EXP-02` | Real-time confusion alert assists timely teacher intervention | Real-time radar vs post-session report | Teacher Sunita S. | 2026-09-08 | 2026-09-17 | Mean time to intervene | Reduced from 18m to 3.2m | **ADOPTED** |
