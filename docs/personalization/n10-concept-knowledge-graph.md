# YOUVA-EdAI Concept Knowledge Graph & Prerequisite Architecture (N10.4)

**Document Reference**: `DOC-YOUVA-N10-KNOWLEDGE-GRAPH`  
**Milestone**: N10 — Deep Personalization  
**Domain**: NCERT / CBSE Grade 8 Curriculum  
**Status**: `AUTHORITATIVE / DAG-VERIFIED`  

---

## 1. Graph Architectural Hierarchy

The curriculum is modeled as a Directed Acyclic Graph (DAG) enforcing strict pedagogical transitivity:

```
Subject
  └── Unit
        └── Concept
              └── Sub-concept
                    └── Prerequisite Skill
                          └── Assessment Item
```

Every edge $(u, v)$ denotes that concept $u$ is a strict prerequisite for concept $v$. A learner cannot transition to concept $v$ until mastery $M(u) \ge 0.75$.

---

## 2. Mathematics Knowledge Graph (Grade 8)

### Chapter 1: Rational Numbers (`math-unit-01`)
```
[integers-review] (Prerequisite Foundation)
        │
        ▼
[fraction-fundamentals] ─────────┐
        │                        │
        ▼                        ▼
[rational-number-def]    [number-line-representation]
        │                        │
        ├────────────────────────┘
        ▼
[rational-addition-subtraction]
        │
        ▼
[rational-multiplication]
        │
        ▼
[reciprocals-and-division]
        │
        ▼
[distributive-property-rational]
        │
        ▼
[rational-word-problems] (Transfer Learning Capstone)
```

### Chapter 2: Linear Equations in One Variable (`math-unit-02`)
```
[algebraic-expressions-review]
        │
        ▼
[linear-equation-definition]
        │
        ▼
[solving-linear-variable-one-side]
        │
        ▼
[solving-linear-variables-both-sides]
        │
        ▼
[linear-equations-word-problems] (Transfer Capstone)
```

**Cross-Unit Bridge**: `[rational-multiplication]` and `[reciprocals-and-division]` serve as strict prerequisites for `[solving-linear-variables-both-sides]` when dealing with fractional coefficients.

---

## 3. Science Knowledge Graph (Grade 8)

### Chapter 8: Cell — Structure and Functions (`sci-unit-01`)
```
[living-organisms-overview]
        │
        ▼
[cell-discovery-and-theory]
        │
        ├────────────────────────┐
        ▼                        ▼
[cell-number-shape-size]  [cell-structure-components]
                                 │
                                 ├──────────────────────┐
                                 ▼                      ▼
                     [cell-membrane-and-wall]    [nucleus-and-cytoplasm]
                                 │                      │
                                 ├──────────────────────┘
                                 ▼
                     [cell-organelles-vacuoles]
                                 │
                                 ▼
                     [plant-vs-animal-cells] (Comparative Capstone)
```

---

## 4. Graph Invariants & Validation Rules

1. **Acyclicity Check**: The graph must contain zero cycles ($\text{Cycle}(G) = \emptyset$). Verified via Tarjan's strongly connected components algorithm.
2. **Prerequisite Gap Diagnosis**: If learner fails an item in `[reciprocals-and-division]`, the engine traces backward along prerequisite edges to inspect $M(\text{rational-multiplication})$ and $M(\text{fraction-fundamentals})$.
3. **Topological Pacing**: Candidates for next activity must belong to the set of unmastered nodes whose direct parents are all satisfied ($M(\text{parent}) \ge 0.75$).
