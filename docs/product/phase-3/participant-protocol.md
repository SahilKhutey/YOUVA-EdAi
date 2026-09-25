# YOUVA EdAI — Phase 3 Participant Onboarding & Baseline Protocol

**Purpose:** Standard operating procedure for recruiting, onboarding, and baselining students, parents/guardians, and educators for the closed pilot.

---

## 1. Participant Recruitment & Enrollment

### 1.1 Cohort Selection
- **School:** Delhi Public School, Sector XII, R.K. Puram, New Delhi.
- **Section:** Grade 8-A (Standard mixed-ability classroom).
- **Target Size:** 28–30 students (all students enrolled in Section 8-A).
- **Inclusion Criteria:** Regularly attending students currently studying Chapter 2 (Linear Equations in One Variable) under CBSE syllabus.

### 1.2 Multi-Stakeholder Onboarding Workflow

```
[School Principal / Admin Authorization]
                   │
                   ▼
[Parent Information Pack Dispatched via School Portal]
                   │
                   ▼
[Parental Verifiable Consent (VPC)]
  (Mobile OTP / Signed Institutional Authorization)
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   [Consent Granted]   [Consent Declined / Revoked]
         │                   │
         ▼                   ▼
[Student Account Activated]  [Standard Classroom Instruction (No AI Access)]
         │
         ▼
[Teacher Onboarding & Baseline Interview]
         │
         ▼
[Mandatory Student Diagnostic Session]
```

---

## 2. Baseline Establishment Protocol (Cycle 3)

Measuring change requires a clear, unpolluted pre-intervention baseline. "Mastery increased" is meaningless without knowing where the cohort started.

### 2.1 Student Pedagogical Baseline
Before any adaptive practice sessions begin, every enrolled student must complete the 10-item Diagnostic Assessment:
1. **Diagnostic Content:** 10 diagnostic questions assessing fundamental prerequisites:
   - One-step linear equations ($x + a = b, ax = b$).
   - Variable expressions with integer coefficients.
   - Two-step equations ($ax + b = c$).
   - Equations with variables on both sides ($ax + b = cx + d$).
   - Word problem modeling.
2. **Captured Baseline Entities:**
   - `studentId`
   - `courseId: "math_grade_8"`
   - `conceptId: "linear_equations_one_variable"`
   - `diagnosticScore`: Raw percentage correct.
   - `initialMasteryProbability` ($P(L_0)$): Initialized via diagnostic outcome (typically $0.10 - 0.35$).
   - `baselineCompletionTimestamp`: ISO 8601 timestamp.

### 2.2 Teacher Baseline Interview
Before student sessions commence, the lead educator undergoes a structured 45-minute qualitative interview:
1. **Expected Student Difficulties:**
   - Smt. Sen notes: *"Students frequently struggle with sign changes when transposing terms across the equals sign (e.g., $3x - 5 = 7$ becoming $3x = 7 - 5$ instead of $7 + 5$), and fractions with variables in the denominator."*
2. **Existing Instructional Approach:**
   - Direct whole-class blackboard instruction followed by textbook exercise assignments; homework checked manually 2–3 days later.
3. **Expectations of the Adaptive System:**
   - Identify struggling students within 24 hours rather than after the bi-weekly test; provide immediate scaffolding when sign transposition errors occur.
4. **Initial Trust & Concerns:**
   - Primary teacher concern: *"Will the AI advance students prematurely before they have mastered step-by-step mathematical reasoning, or give away answers through hints?"*
   - Success criterion defined by teacher: *"I must be able to see exactly why an item was recommended and change it if I feel the student is guessing."*
