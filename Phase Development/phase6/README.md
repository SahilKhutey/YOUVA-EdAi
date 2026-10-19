# YOUVA-EdAi: Phase 6 — Kindergarten & Junior Tier (Early Childhood & Parent Co-Pilot)

Phase 6 implements the Early Childhood / Foundational Stage (ages 4–6, UKG / Grade 1), featuring voice-first minimal-reading interfaces, hard technical AI content constraints, and an active Parent Co-Pilot supervisory terminal.

---

## Directory Structure
```
phase6/
├── __init__.py
├── README.md
├── schemas/
│   ├── junior_scope.schema.json
│   ├── content_guard.schema.json
│   ├── parent_copilot.schema.json
│   ├── pilot_cohort.schema.json
│   └── pilot_report.schema.json
├── scope/
│   └── junior_scope_lock.json
├── content/
│   ├── early_lexicon.json
│   ├── foundational_numeracy_bank.json
│   └── foundational_diagnostic.json
├── models/
│   ├── __init__.py
│   ├── content_guard.py
│   ├── parent_copilot.py
│   └── junior_pilot_evaluator.py
├── data/
│   ├── child_safety_review.json
│   ├── pilot_cohort_manifest.json
│   └── pilot_evaluation_report.json
├── scripts/
│   ├── run_junior_simulation.py
│   └── validate_phase6_gate.py
└── tests/
    ├── __init__.py
    ├── test_junior_scope.py
    ├── test_content_guard.py
    ├── test_parent_copilot.py
    ├── test_junior_content.py
    └── test_phase6_e2e.py
```

---

## Key Invariants

1. **Hard Technical AI Content Limits**:
   - Prompts must be drawn strictly from certified early childhood vocabulary (`early_lexicon.json`).
   - Sentence length capped at 8 words (Flesch-Kincaid $\le 1.0$).
   - Absolute ban on dark patterns (urgency countdowns, loss framing, streaks).

2. **Mandatory 15-Minute Screen-Time Limit**:
   - Sessions automatically lock after 15.0 minutes for a compulsory 10-minute rest break.

3. **Parent Co-Pilot Terminal (`/parent/copilot`)**:
   - Real-time mirrored audio transcript and co-play pedagogical guidance.
   - Unilateral parental pause and kill switch.

4. **Voice-First Minimal-Reading UI (`/junior`)**:
   - Large pictorial touch cards, audio voice prompts, and gentle audio feedback.

---

## Verification & Execution

```powershell
# Run exit gate validator
python phase6/scripts/validate_phase6_gate.py

# Run simulation
python phase6/scripts/run_junior_simulation.py

# Run unit and integration tests
pytest phase6/tests -v
```
