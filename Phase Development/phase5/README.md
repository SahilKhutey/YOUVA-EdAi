# YOUVA-EdAi: Phase 5 — High School Expansion & Skills Passport (W3C VC 2.0)

Phase 5 expands YOUVA-EdAi into the Secondary School tier (CBSE Class 10 Mathematics: Quadratic Equations), implementing mature adolescent UX, empirical content, verifiable credentialing, and closed pilot validation.

---

## Directory Structure
```
phase5/
├── __init__.py
├── README.md
├── schemas/
│   ├── highschool_scope.schema.json
│   ├── skills_passport.schema.json
│   ├── pilot_cohort.schema.json
│   └── pilot_report.schema.json
├── scope/
│   └── mini_scope_lock.json
├── content/
│   ├── grade10_quadratic_equations_bank.json
│   ├── grade10_diagnostic_assessment.json
│   └── grade10_concept_dag.json
├── models/
│   ├── __init__.py
│   ├── skills_passport.py
│   ├── highschool_ux_state.py
│   └── pilot_evaluator.py
├── data/
│   ├── pilot_cohort_manifest.json
│   ├── pilot_evaluation_report.json
│   └── sample_skills_credential.json
├── scripts/
│   ├── run_highschool_simulation.py
│   └── validate_phase5_gate.py
└── tests/
    ├── __init__.py
    ├── test_scope_lock.py
    ├── test_quadratic_content.py
    ├── test_skills_passport.py
    ├── test_pilot_evaluation.py
    └── test_phase5_e2e.py
```

---

## Key Invariants

1. **Human Authorization for Credential Issuance**:
   - AI evaluates and recommends, but **cannot autonomously issue credentials**.
   - Certified human teacher approval and cryptographic digital signature are strictly required (`HumanAuthorizationRequiredError`).

2. **Zero-PII Public Credential Payload**:
   - No direct student names, emails, phone numbers, or dates of birth in the W3C VC 2.0 `credentialSubject`.
   - Students are referenced solely by pseudonymized DIDs (`did:youva:student:<hash>`).

3. **Anti-Gaming Thresholds**:
   - $\ge 15$ questions, $\ge 45$ minutes on task, $\ge 80\%$ independent accuracy, $\ge 85\%$ BKT mastery probability.

4. **Adolescent UX (`frontend/app/dashboard/highschool/page.tsx`)**:
   - No cartoon characters, no celebratory confetti, no arbitrary coins.
   - Analytical telemetry: learning velocity ($\Delta P(L) / \text{hr}$), concept readiness radar, and student self-directed goals.

---

## Verification & Execution

```powershell
# Run exit gate validator
python phase5/scripts/validate_phase5_gate.py

# Run simulation
python phase5/scripts/run_highschool_simulation.py

# Run unit and integration tests
pytest phase5/tests -v
```
