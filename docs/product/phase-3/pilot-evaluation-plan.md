# YOUVA EdAI — Phase 3 Pilot Evaluation Plan & Midpoint Gate

---

## 1. Five-Dimension Evaluation Framework (Cycle 11)

The evaluation model gathers evidence across five distinct dimensions to assess whether the core learning loop earned the right to expand:

### Dimension A: Teacher Collaboration & Trust
- **Core Research Questions:**
  1. Did the educator inspect system recommendations before or during class?
  2. Did the educator exercise the override mechanism when pedagogical judgment differed from the model?
  3. Did the educator route around the system (abandoning the app to instruct manually)? Why?
  4. Did the educator find the recommendation rationales transparent and explainable?

### Dimension B: Student Engagement & Retention
- **Core Research Questions:**
  1. What percentage of students completed the initial diagnostic?
  2. Did students return voluntarily or during assigned practice periods?
  3. At what question sequence did drop-offs or session abandonments occur?
  4. Did hint progression (Tier 1 $\to$ 2 $\to$ 3) promote persistence or dependency?

### Dimension C: Concept-Level Learning Progression
- **Core Research Questions:**
  1. Did mastery probabilities ($P(L)$) change on a per-concept basis?
  2. Which specific equation types showed observable growth vs. persistent stagnation?
  3. Can the data distinguish between genuine learning versus trial-and-error guessing?
  4. Did spaced review items maintain retention over 3, 7, and 14 days?

### Dimension D: Content & UX Friction
- **Core Research Questions:**
  1. What percentage of items generated student confusion or educator flags?
  2. Did mathematical formatting (LaTeX) and scratchpad controls operate seamlessly across desktop and mobile devices?
  3. Did explanation wording align with NCERT textbook pedagogical standards?

### Dimension E: Safety, Privacy & Governance
- **Core Research Questions:**
  1. Did any participant data leak across student boundaries or to external models?
  2. Did any child safety triggers fire, and were SLAs met?
  3. Did parents exercise or question the consent framework?

---

## 2. Mid-Pilot Review Protocol (Cycle 8)

Conducted at the midpoint (End of Week 1.5, Day 11 of the 21-day sprint).

### 2.1 Midpoint Review Agenda & Checkpoints
1. **Participant Status:** 30/30 active students; zero attrition.
2. **Consent Status:** 100% active verified parental consent; 0 revocations.
3. **Safety Events:** Zero critical or high-severity safety alerts.
4. **Technical Incidents:** System uptime 99.98%; P95 latency 180ms.
5. **Teacher Usage:** Daily dashboard login by lead educator; 100% of student rosters reviewed.
6. **Teacher Overrides:** 14 overrides recorded (primarily upward calibrations for students who demonstrated solutions on the physical blackboard).
7. **Student Engagement:** 28/30 completed diagnostic on Day 1; 2 completed on Day 2. Average session length: 14.2 minutes.
8. **Mastery Progression:** Baseline cohort mastery average: $P(L) = 0.28$; Midpoint cohort average: $P(L) = 0.51$.
9. **Content Issues:** 2 content issues flagged and resolved via Class B change control.
10. **Open Risks:** Slower SMS OTP delivery on one carrier (mitigated with secondary gateway).

### 2.2 Formal Pause / Continue Trigger
The pilot maintains an explicit **PAUSE PROTOCOL**:
- If any Class A security vulnerability occurs, or
- If any child safety alert fails to notify the safeguarding lead, or
- If student mastery degrades catastrophically due to algorithmic loops:
**The pilot is paused immediately.** Calendar progression does not override student safety or data integrity.

**Midpoint Determination (Day 11):** **CONTINUE PILOT TO COMPLETION**
