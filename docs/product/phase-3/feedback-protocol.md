# YOUVA EdAI — Phase 3 Feedback & Teacher Trust Protocol

---

## 1. Teacher Trust Behavioral Measurement (Cycle 4)

Trust is not measured by survey questions such as *"Do you like the AI?"*  
In Phase 3, **trust is measured through observable behavioral interactions** with the platform's recommendations and override mechanisms.

### 1.1 Observable Recommendation Disposition State Machine

For every recommendation surfaced to the educator on the classroom dashboard:

```
[System Recommendation Generated]
               │
               ▼
[Teacher Views Recommendation]
               │
     ┌─────────┼─────────┬─────────┐
     ▼         ▼         ▼         ▼
[ACCEPTED] [ADJUSTED] [REJECTED] [IGNORED]
```

1. **ACCEPTED:** Educator inspects recommendation and confirms the proposed practice tier or concept review.
2. **ADJUSTED:** Educator modifies difficulty or shifts focus to a specific sub-topic while accepting the system's diagnosis.
3. **REJECTED:** Educator rejects the recommendation and sets a manual override (`SET_MASTERY`, `DECREASE_DIFFICULTY`, etc.).
4. **IGNORED:** Recommendation is surfaced but educator takes no action in the platform, choosing instead to handle the student offline.

### 1.2 The "Bypass" Observation Protocol
When an educator ignores or overrides a recommendation to provide direct manual instruction, the platform captures:
1. **Was the recommendation inspected prior to intervention?**
2. **What pedagogical rationale was documented?**
3. **Did the subsequent student learning path actually change?**

Weekly Educator Debrief Mandatory Question:
> *"When you disagreed with the system's recommendation, what did you do instead in the classroom, and why?"*

---

## 2. Content Feedback Loop (Cycle 6)

Content defects must be logged and resolved through a controlled review pipeline. **No item active in the pilot may be silently modified without versioning and an immutable audit trail.**

### 2.1 Content Issue Taxonomy

```typescript
export type ContentIssueType =
  | "TOO_EASY"            // Student mastery inflated; question requires no multi-step reasoning
  | "TOO_HARD"            // Question introduces concepts beyond Chapter 2 NCERT scope
  | "AMBIGUOUS"           // Phrasing allows multiple mathematically valid interpretations
  | "INCORRECT"           // Answer key or solution calculation is mathematically erroneous
  | "MISSING_CONCEPT"     // Question assumes an untaught prerequisite without scaffolding
  | "BAD_EXPLANATION"     // Explanation is confusing or contradicts the accepted step
  | "CURRICULUM_MISMATCH" // Not aligned with CBSE Grade 8 learning objectives
  | "UI_CONFUSION";       // Formula LaTeX rendering defect or scratchpad friction
```

### 2.2 Content Remediation Pipeline

```
[Student / Teacher In-App Flag]
               │
               ▼
[Issue Logged in Repository Issue Tracker]
               │
               ▼
[Content Lead & Subject Matter Expert (SME) Review]
               │
               ▼
[Severity Classification & Version Bump (e.g., v1.0 -> v1.1)]
               │
               ▼
[Draft Remediation & Mathematical Re-check]
               │
               ▼
[SME Written Sign-off]
               │
               ▼
[Controlled Database Update (Change Control Logged)]
```
