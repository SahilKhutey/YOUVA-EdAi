# YOUVA EdAI — Phase 4 Content Expansion Specification

**Specification Version:** 1.0  
**Scope Invariant:** Content expansion in Phase 4 is restricted strictly to the locked Phase 0 scope (CBSE Grade 8 Mathematics, Chapter 2: Linear Equations in One Variable). Zero expansion into other grades or subjects is permitted.

---

## 1. Evidence-Driven Content Expansion Pipeline (Cycle 10)

The expansion targets content gaps surfaced by Phase 3 pilot evidence—specifically, students struggling with fraction coefficients and negative transpositions.

```
[Phase 3 Telemetry Analysis]
       │
       ▼
[Identify Specific Content Gaps]
 (e.g. Scaffolding for equations with fractional terms)
       │
       ▼
[Author Targeted Content Items (ContentItemV2)]
       │
       ▼
[Curriculum Alignment & NCERT Syllabus Validation]
       │
       ▼
[Mathematical Correctness & Distractor Review]
       │
       ▼
[SME Pedagogical Sign-off]
       │
       ▼
[Controlled Database Ingestion & Publication]
```

---

## 2. ContentItemV2 Data Schema

Every expanded content item preserves Phase 1 metadata while incorporating prerequisite and misconception tagging to enable explainable personalization:

```typescript
export interface ContentItemV2 {
  id: string;
  conceptId: string;
  courseId: string; // "CBSE-MATH-G8"
  curriculumReference: string; // e.g. "NCERT Ch 2, Exercise 2.5"

  prompt: string;      // LaTeX mathematical equation prompt
  answer: string;      // Canonical solution string
  options?: string[];  // 4 distractor options for MCQ mode

  // Pedagogical Explanation & Multi-Tier Scaffolding
  explanation: string;
  explanationType: "STEP_BY_STEP" | "EXAMPLE_FIRST" | "CONCEPTUAL";
  hints: {
    tier1: string; // High-level conceptual clue
    tier2: string; // Intermediate algebraic decomposition step
    tier3: string; // Full worked solution step
  };

  // Calibration Metadata
  difficulty: number; // 0.0 to 1.0 (EASY: 0.1-0.3, MEDIUM: 0.4-0.6, HARD: 0.7-0.9)
  estimatedSeconds: number;

  // Prerequisite & Misconception Tagging
  learningObjective: string;
  prerequisiteConceptIds: string[];
  misconceptionTags: string[]; // e.g. ["SIGN_TRANSPOSITION", "FRACTION_DISTRIBUTION"]

  // Publication & SME Governance
  status: "DRAFT" | "SME_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
  reviewedBy: string | null;
  reviewedAt: string | null;
}
```

---

## 3. Targeted Phase 4 Question Bank Expansion

Building upon the initial 50-item bank, 30 new SME-reviewed items are added to Chapter 2:
- **10 Items:** Isolating terms with negative fractional coefficients (e.g., $\frac{x-5}{3} = \frac{x-3}{5}$).
- **10 Items:** Linear equations requiring distributive multiplication across binomials (e.g., $5x - 2(2x - 7) = 2(3x - 1) + \frac{7}{2}$).
- **10 Items:** Step-by-step word problem modeling (perimeter, consecutive integers, and coin/digit problems).

All 30 items must satisfy `CONTENT-001` through `CONTENT-006` verification tests before publication.
