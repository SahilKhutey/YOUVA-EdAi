# YOUVA EdAI — Phase 4 Knowledge Graph Specification

**Specification Version:** 1.0  
**Phase State:** WORKING BASELINE  
**Governing Rule:** No algorithmic feedback loop may silently rewrite the curriculum knowledge graph. All edge additions, deletions, or weight adjustments require human subject matter expert (SME) approval.

---

## 1. Graph Data Model (Cycle 2)

```typescript
export interface ConceptNode {
  id: string;
  courseId: string; // e.g. "CBSE-MATH-G8"
  name: string;     // e.g. "Solving Equations with Variables on Both Sides"
  curriculumReference: string; // e.g. "NCERT Ch 2, Section 2.3"
  learningObjectives: string[];
}

export interface ConceptEdge {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationship:
    | "PREREQUISITE"   // Target concept cannot be mastered without source concept
    | "RELATED"        // Shared conceptual context, but no strict dependency
    | "BUILDS_ON"      // Extension / deepening of source concept
    | "COMMON_ERROR";  // Source misconception frequently corrupts target concept
  confidence: number;  // 0.0 to 1.0 (Strength of empirical support)
  source:
    | "CURRICULUM"     // Direct NCERT textbook syllabus requirement
    | "SME"            // Math educator / curriculum specialist expert review
    | "PILOT_EVIDENCE";// Empirically derived from Phase 3 student attempt sequences
  status: "DRAFT" | "SME_REVIEW" | "APPROVED" | "PUBLISHED";
  reviewedBy: string | null;
  reviewedAt: string | null;
}
```

---

## 2. Grade 8 Linear Equations Validated Concept DAG

Validated against NCERT Chapter 2 curriculum sequencing:

```
[INTEGER_ARITHMETIC] (NCERT Grade 7 Prerequisite)
         │
         ▼
[ALGEBRAIC_EXPRESSIONS] (Variables, Coefficients, Like Terms)
         │
         ▼
[LINEAR_EQ_ONE_STEP] (x + a = b, ax = b)
         │
         ▼
[LINEAR_EQ_TWO_STEP] (ax + b = c)
         │
         ├───────────────────────────────┐
         ▼                               ▼
[LINEAR_EQ_BOTH_SIDES]          [LINEAR_EQ_FRACTIONS]
  (ax + b = cx + d)             ((ax + b)/c = (dx + e)/f)
         │                               │
         └───────────────┬───────────────┘
                         ▼
             [LINEAR_EQ_WORD_PROBLEMS]
             (Age, perimeter, and digit modeling)
```

---

## 3. Educational Governance: Graph Mutation Pipeline

Under no circumstances does machine learning or student telemetry directly mutate the production knowledge graph.

```
[Phase 3 Pilot Telemetry / Co-occurrence Matrix]
                       │
                       ▼
          [Candidate Graph Change Proposed]
           (e.g., Fraction reduction flagged as
            hidden blocker for word problems)
                       │
                       ▼
        [Subject Matter Expert (SME) Review]
         ├── Pedagogical sanity check
         └── Curriculum alignment verification
                       │
                       ▼
             [SME Formal Sign-off]
                       │
                       ▼
            [Published Knowledge Graph]
```
