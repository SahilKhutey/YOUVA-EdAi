# YOUVA-EdAi: Phase 4 — Personalization Depth

Phase 4 deepens pedagogical personalization in YOUVA-EdAi through mathematically validated psychometrics, prerequisite graphs, progressive hint scaffolding, and error classification.

---

## Directory Structure
```
phase4/
├── __init__.py
├── README.md
├── schemas/
│   ├── concept_dag.schema.json
│   ├── hint_scaffolding.schema.json
│   └── error_taxonomy.schema.json
├── data/
│   ├── grade8_math_concept_dag.json
│   ├── question_hints_bank.json
│   ├── error_classification_rules.json
│   └── pruned_cognitive_metrics.json
├── models/
│   ├── __init__.py
│   ├── concept_dag.py
│   ├── hint_scaffolding.py
│   ├── error_analyzer.py
│   └── override_review.py
├── scripts/
│   ├── run_personalization_demo.py
│   └── validate_phase4_gate.py
└── tests/
    ├── __init__.py
    ├── test_concept_dag.py
    ├── test_hint_scaffolding.py
    ├── test_error_analyzer.py
    ├── test_override_review.py
    └── test_phase4_e2e.py
```

---

## Key Features

1. **Concept Directed Acyclic Graph (DAG)**:
   - 7 CBSE Grade 8 Linear Equations nodes, 7 prerequisite edges, 0 cycles.
   - Cycle detection via DFS.
   - Topological sorting via Kahn's algorithm.
   - Backward prerequisite remediation path tracer.
   - Zone of Proximal Development (ZPD) frontier calculation.

2. **3-Tier Adaptive Hint Scaffolding**:
   - Tier 1: Conceptual Cue (General pedagogical prompt).
   - Tier 2: Strategic Step (Actionable decomposition step).
   - Tier 3: Concrete Execution (Direct mathematical walk-through).
   - Strict progressive disclosure enforcement.
   - Calibrated BKT evidence discounting.

3. **Student Mistake Taxonomy & Diagnostic Feedback**:
   - 5 canonical error codes: `SIGN_ERROR`, `DISTRIBUTIVE_ERROR`, `COMBINING_LIKE_TERMS_ERROR`, `FRACTION_CLEARANCE_ERROR`, `ARITHMETIC_ERROR`.
   - Pedagogical explanations and remedial action recommendations.

4. **Educator Override Pattern Review Loop**:
   - Tracking educator override decisions.
   - Psychometric calibration recommendations for curriculum items.

5. **Speculative Cognitive Metrics Purge**:
   - Audited deprecation of "Cognitive Twin", "VARK Learning Styles", "Neuro-Attentional Index", etc.

---

## Verification & Testing

```bash
# Run exit gate validator
python phase4/scripts/validate_phase4_gate.py

# Run demo
python phase4/scripts/run_personalization_demo.py

# Run unit and integration tests
pytest phase4/tests -v
```
