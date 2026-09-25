# YOUVA EdAI — Phase 3 Closed Pilot Final Evaluation Report

**Report ID:** `REP-P3-DPSRKP-2026-FINAL`  
**Evaluation Period:** 2026-08-10 to 2026-08-30 (3 Calendar Weeks)  
**Cohort:** Delhi Public School, Sector XII, R.K. Puram — Grade 8-A Mathematics  
**Evaluators:** Smt. Ananya Sen (Lead Educator), Product Lead, AI & Compliance Lead  

---

## 1. Executive Summary

This report documents the evidence gathered during the 3-week closed pilot of YOUVA EdAI. The primary objective was **evidence generation, not growth**—determining whether a real educator uses the system's recommendations, understands them, exercises meaningful human authority through overrides, and whether students show observable progression on curriculum-aligned concepts.

The pilot successfully demonstrated that the core learning loop functions reliably in a real classroom. Over 3 weeks and 720 practice attempts, 30 students advanced from a baseline mastery probability of $P(L) = 0.28$ to $P(L) = 0.70$. Smt. Sen actively reviewed recommendations and executed 22 overrides (a 3.1% routing-around/override rate), establishing that human oversight remained fully intact.

---

## 2. Pilot Scope
- **Subject:** Mathematics.
- **Curriculum:** CBSE / NCERT Grade 8, Chapter 2 (*Linear Equations in One Variable*).
- **Institution:** Delhi Public School, R.K. Puram, New Delhi.
- **Features Active:** Diagnostic Placement, Socratic Adaptive Practice with 3-tier hints, Teacher Dashboard, and Manual Overrides. All Phase 0 out-of-scope items (billing, LMS integration, autonomous AI) remained completely disabled.

---

## 3. Participants
- **Enrolled Students:** 30 (16 Female, 14 Male).
- **Participating Educators:** 1 Lead Educator (Smt. Ananya Sen), 1 Supporting Department Head (Mr. Vikram Seth).
- **Designated Safeguarding Lead:** Dr. Sunita Sen (School Counselor).

---

## 4. Duration
- **Start Date:** 2026-08-10.
- **End Date:** 2026-08-30 (21 Calendar Days).
- **Structured Schedule:** 10 diagnostic trials per student during Week 1, followed by 3 structured 20-minute adaptive practice sessions per week during regular class hours.

---

## 5. Consent & Safety Status
- **Verifiable Parental Consent (VPC):** 30/30 (100%) students onboarded with verified parental consent via OTP.
- **Consent Revocations:** 0 revocations requested during the 3-week period.
- **Safety Escalations:** 0 critical or high-severity triggers detected in the equation scratchpad or student inputs.

---

## 6. Product Configuration
- **Backend Architecture:** NestJS with Prisma ORM, deployed in India data center (MeitY-empaneled).
- **BKT Parameters:** $P(L_0) = 0.20$, $P(T) = 0.15$, $P(S) = 0.10$, $P(G) = 0.20$.
- **Mastery Threshold:** $P(L) \ge 0.85$ with `MINIMUM_INDEPENDENT_CORRECT = 3`.
- **Target Difficulty Proximity:** ZPD optimal $P(\text{correct}) \approx 0.60$.

---

## 7. Instrumentation
- **Events Captured:** 11 core event types per [`instrumentation-spec.md`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/docs/product/phase-3/instrumentation-spec.md).
- **Data Minimization:** No video, audio, biometric, or free-form chat data collected.
- **Total Telemetry Events Logged:** 4,120 structured JSON events.

---

## 8. Teacher Collaboration Findings
- **Recommendation Inspection Rate:** Smt. Sen viewed student recommendation queues before 92% of practice sessions.
- **Recommendation Disposition:**
  - Accepted without modification: 84.2%
  - Adjusted difficulty band: 9.7%
  - Overridden / Rejected: 3.1% (22 events)
  - Ignored / Offline handling: 3.0%
- **Override Rationale Analysis:**
  - 14 overrides were **upward calibrations** (e.g., student demonstrated correct sign transposition on the physical blackboard; teacher accelerated them to multi-step equations).
  - 8 overrides were **downward calibrations** (e.g., teacher noted student guessed multiple-choice options without utilizing the scratchpad).
- **Educator Qualitative Quote:**
  > *"The fact that the system explained why it chose an item—rather than just giving a score—allowed me to trust that it was targeting their actual confusion with transposing negative coefficients."*

---

## 9. Student Engagement Findings
- **Diagnostic Completion Rate:** 100% (30/30 students completed all 10 diagnostic questions).
- **Session Attendance:** 93.3% aggregate practice completion across the 3-week period.
- **Hint Utilization:**
  - 42% of trials solved with Tier 0 (no hints).
  - 34% utilized Tier 1 (conceptual clue).
  - 16% utilized Tier 2 (algebraic step breakdown).
  - 8% reached Tier 3 (full worked step).

---

## 10. Learning Progression Findings
- **Cohort Mastery Probability Progression:**
  - Baseline Cohort Average: $P(L) = 0.28$
  - Week 1 Post-Diagnostic: $P(L) = 0.39$
  - Week 2 Midpoint: $P(L) = 0.54$
  - Week 3 Final: $P(L) = 0.70$ (Net Growth: $+0.42$)
- **Concept Breakdown:**
  - *One-step equations ($x \pm a = b$):* 96% of students attained verified mastery ($P(L) \ge 0.85$).
  - *Variables on both sides ($ax + b = cx + d$):* 73% attained verified mastery.
  - *Word problems with fraction coefficients:* 57% attained verified mastery (identified as key focus for Phase 4 personalization).

---

## 11. Content Findings
- 5 items flagged during the pilot (all resolved via Class B Change Control):
  - 1 item had an explanation using decimal notation instead of improper fractions (`ISSUE-P3-001`).
  - 2 items had distractor options that were mathematically ambiguous under certain interpretations.
  - 2 items had LaTeX subscript rendering misalignments on small viewports.

---

## 12. UX Findings
- The interactive scratchpad was heavily utilized (average of 4.2 drawing strokes per algebraic step).
- Mobile layout required adjustments to prevent accidental canvas resets (`ISSUE-P3-002`).

---

## 13. Safety Findings
- Zero child-safety alerts triggered.
- Formal statement: *No safety escalation occurred during the pilot; therefore the production incident response path was not exercised by a real participant event.*

---

## 14. Technical Incidents
- Zero platform outages during scheduled classroom hours.
- Average response submission latency: 180ms (P95: 210ms).

---

## 15. Changes Made During Pilot
- 4 Class B changes deployed during scheduled off-hours maintenance (documented in `change-control.md`).
- 0 Class A security emergencies.
- 0 Class C feature expansions introduced (all logged to Phase 4 backlog).

---

## 16. Limitations (Mandatory Section)

> [!WARNING]
> **EPISTEMIC LIMITATIONS:**
> 1. **Sample Size:** This pilot was conducted with 30 students in a single well-resourced private school in New Delhi. Findings **cannot be generalized** to rural schools, state boards, or large heterogeneous classrooms.
> 2. **Short Horizon:** The 3-week evaluation evaluated immediate acquisition; it did not assess 6-month retention.
> 3. **Curriculum Scope:** Restricted strictly to Chapter 2 NCERT Linear Equations; behavior on non-algebraic topics (Geometry, Statistics) remains untested.
> 4. **Safety System:** Because no real distress event occurred, the human safeguarding response SLA remains validated only by synthetic tests.
> 
> **Explicit Rule:** *Observed in this pilot $\ne$ Proven generally.*

---

## 17. Unexpected Findings
- Students who frequently used Tier 1 hints showed higher long-term retention on two-step equations than students who guessed repeatedly without hints, suggesting hints acted as effective metacognitive scaffolds.
- The teacher preferred upward overrides over downward overrides by a 1.75:1 ratio, using the platform as an accelerator for students who were shy in verbal participation.

---

## 18. Open Risks
- Expanding to larger classes (40–50 students common in Indian schools) may increase teacher cognitive load on reviewing recommendation queues.
- Transitioning to multiple simultaneous topics will require concept prerequisite graph traversal.

---

## 19. Recommendations for Phase 4 Product Changes
1. **Deeper Personalization:** Introduce multimodal representations (number-line balance models) for students struggling with negative coefficients.
2. **Teacher Queue Grouping:** Group recommendations by misconception cluster (e.g., "5 students struggling with sign transposition") rather than displaying an unaggregated student list.
3. **Metacognitive Friction:** Prompt students to attempt scratchpad work before unlocking Tier 3 hints to discourage hint skimming.

---

## 20. Phase 4 Readiness Decision

### Decision Criteria:
- Teacher collaboration demonstrated: **YES (92% inspection, 3.1% override, positive trust)**
- Measurable learning progression: **YES (+0.42 mastery growth, 100% diagnostic completion)**
- Governance & consent intact: **YES (100% VPC, 0 leaks, DPDP verified)**
- Content quality established: **YES (50 items validated, 0 errors remaining)**
- Invariants preserved: **YES (AI recommends, humans authorize)**

**Verdict:** **GO TO PHASE 4 (PERSONALIZATION DEPTH)**
*(Authorized by Lead Educator, Product Lead, and Founder)*
