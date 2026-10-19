# YOUVA EdAI — Phase 1: Core Learning Loop MVP

This package contains the complete, mathematically grounded implementation of **Phase 1 (Core Learning Loop MVP)** for the YOUVA EdAI platform.

## Architecture

```
phase1/
├── models/
│   ├── bkt_engine.py         # 4-parameter Bayesian Knowledge Tracing (Corbett & Anderson)
│   ├── knowledge_state.py    # Student knowledge state, streak tracking, mastery milestones
│   ├── item_selector.py      # Adaptive item selection in Zone of Proximal Development (ZPD)
│   └── teacher_override.py   # Teacher dashboard intervention and audit logging
├── content/
│   ├── grade8_linear_equations_bank.json # 20 peer-reviewed questions for Grade 8 Linear Equations
│   └── diagnostic_assessment.json        # 5-item diagnostic assessment for prior calibration
├── scripts/
│   ├── run_learning_loop.py  # End-to-end simulator for the learning loop
│   └── validate_phase1_gate.py # Phase 1 exit gate validator
└── tests/
    ├── test_bkt_engine.py    # Mathematical correctness unit tests
    ├── test_question_bank.py # Content integrity tests
    ├── test_adaptive_selection.py # ZPD and anti-repetition tests
    ├── test_teacher_override.py # Teacher override and signature tests
    └── test_phase1_e2e.py    # End-to-end loop integration tests
```

## Running Verification

```powershell
# Run the learning loop simulation
python phase1/scripts/run_learning_loop.py

# Run Phase 1 exit gate validator
python phase1/scripts/validate_phase1_gate.py

# Run all Phase 1 unit tests
python -m pytest phase1/tests -v

# Run all repository tests across all phases
python -m pytest phase0/tests phase1/tests phase9/tests final_phase/tests -v
```
