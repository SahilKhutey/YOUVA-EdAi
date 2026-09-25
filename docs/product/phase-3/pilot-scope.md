# YOUVA EdAI — Phase 3 Closed Pilot Scope Specification

**Version:** 1.0  
**Phase State:** WORKING BASELINE  
**Branch:** `feature/phase-3-closed-pilot`  
**Governing Principle:** Phase 3 is an evidence-generation phase, not a growth phase. No Phase 4 personalization depth should compensate for evidence that the core student → adaptive learning → teacher oversight → teacher override loop is not functioning.

---

## 1. Locked Pilot Scope

The closed pilot operates strictly within the boundaries locked in Phase 0 and verified in Phase 1 and Phase 2.

| Dimension | Pilot Boundary Parameter |
|---|---|
| **Target Institution** | Delhi Public School (DPS), Sector XII, R.K. Puram, New Delhi |
| **Cohort Definition** | Grade 8, Section A (Single Classroom Cohort: 28–30 enrolled students) |
| **Curriculum Framework** | CBSE / NCERT Grade 8 Mathematics |
| **Subject & Unit** | Chapter 2: *Linear Equations in One Variable* |
| **Operating Model** | B2B School-First (Classroom-directed with teacher in the loop) |
| **Lead Educator** | Smt. Ananya Sen / Smt. Ritu Sharma (Head of Grade 8 Mathematics) |
| **Safeguarding Contact** | Dr. Sunita Sen (School Counselor / Designated Safeguarding Lead) |
| **Legal Framework** | Digital Personal Data Protection Act, 2023 (DPDP Act §9 compliance) |
| **Duration** | 3 Calendar Weeks (Structured pedagogical sprint within Term 1) |

---

## 2. Core Learning Loop Under Evaluation

The pilot evaluates exclusively the smallest viable pedagogical feedback loop:

```
[Student]
   │
   ▼
[Diagnostic Assessment] (10 Items)
   │
   ▼
[Knowledge State per Concept] (BKT Mastery Probability P(L))
   │
   ▼
[Adaptive Item Selector] (Deterministic ZPD targeting ~0.60 P(correct))
   │
   ▼
[Practice Item] (40 Curated Items with 3-Tier Progressive Hints)
   │
   ▼
[Student Response] (Independently graded by backend)
   │
   ▼
[BKT State Update] (Corbett & Anderson 1995 model)
   │
   ├──────────────────────────────┬──────────────────────────────┐
   ▼                              ▼                              ▼
[Student Progress UI]    [Teacher Dashboard]          [Safety Escalator]
                          (Real-time State)           (Zero AI Resolution)
                                  │
                                  ▼
                          [Teacher Override]
                          (Authoritative Event)
                                  │
                                  ▼
                         [Updated Learning Plan]
```

---

## 3. Explicit Pilot Exclusions (Prohibited Features)

The following capabilities are strictly forbidden from entering the pilot environment:
1. **Commercial / Payment Gateways:** No Stripe, payment processing, or subscription tiers.
2. **LMS / SIS Deep Integrations:** No LTI 1.3, OneRoster, or automated grade passback; enrollment is managed via controlled CSV/administrative cohort ingestion.
3. **Autonomous AI Policy Engines:** No reinforcement learning difficulty tuning, autonomous curriculum pacing, or unreviewed AI progressions.
4. **LLM Question Generation:** No live model generation of practice items during student sessions; 100% of served items are pre-reviewed, curriculum-aligned questions.
5. **Additional Tiers & Subjects:** No Kindergarten, Elementary, or High School; no Science, English, or Social Studies.
6. **Multi-Jurisdiction Processing:** No data transfer outside Indian sovereign territory (DPDP Act fiduciary boundary).
