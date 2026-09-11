# YOUVA EdAI — Phase 0: Scope Governance Package

Phase 0 establishes four immutable MVP decisions and four controlled artifacts before any product code for the MVP is committed.

## Directory Structure

```
phase0/
├── README.md                     # Operational documentation
├── scope-lock.json               # Machine-readable MVP decision record (fail-closed)
├── scope-lock.schema.json        # JSON Schema (Draft 2020-12)
├── compliance-checklist.json     # 10-point regulatory implementation controls
├── signoffs.json                 # Stakeholder approval record
├── phase0-config.json            # Governance configuration & blocker definitions
├── scripts/
│   ├── validate_scope_lock.py    # Scope Lock integrity validator
│   ├── validate_compliance.py    # Compliance checklist validator
│   ├── validate_signoffs.py      # Stakeholder sign-off validator
│   └── validate_phase1_gate.py   # Master Phase 1 blocking gate
└── tests/
    ├── test_scope_lock.py        # Pytest test suite for scope lock rules
    ├── test_compliance.py        # Pytest test suite for compliance controls
    ├── test_signoffs.py          # Pytest test suite for sign-offs
    └── test_phase1_gate.py       # Pytest test suite for gate blockers
```

## Running Verification

### 1. Run the Unit Test Suite
```bash
python -m pytest phase0/tests -v
```

### 2. Run Individual Validators
```bash
# Scope lock validation
python phase0/scripts/validate_scope_lock.py

# Compliance checklist validation
python phase0/scripts/validate_compliance.py

# Stakeholder sign-off validation
python phase0/scripts/validate_signoffs.py
```

### 3. Run Master Phase 1 Blocking Gate
```bash
python phase0/scripts/validate_phase1_gate.py
```

> **Invariant**: In draft state, all validators FAIL closed by design. Only when real decisions, regulatory compliance reviews, and stakeholder approvals are populated does the Phase 1 Gate emit `PHASE 0 COMPLETE — PHASE 1 MAY BEGIN`.
