# YOUVA EdAI — Phase 9: Institutional & Market Scale

This package contains the executable governance artifacts, schemas, validators, and unit tests for **Phase 9 (Institutional & Market Scale)** of the YOUVA EdAI platform.

## Directory Structure

```
phase9/
├── jurisdictions/
│   ├── jurisdiction.schema.json      # Schema for regulatory jurisdiction profiles
│   ├── registry.json                 # Jurisdiction registry and failover routing rules
│   ├── in-dpdp.json                  # India DPDP Act 2023 compliance specification
│   ├── us-coppa-ferpa.json           # US COPPA & FERPA compliance specification
│   └── eu-gdpr.json                  # EU GDPR candidate draft specification
├── credentials/
│   ├── credential.schema.json        # W3C VC 2.0 / Open Badges 3.0 schema
│   ├── anti-gaming.json              # Anti-gaming & speedrun integrity rules
│   └── sample-credential.json        # Validated sample credential
├── governance/
│   ├── governance-scheduler.json     # 7 mandatory recurring review classes
│   ├── compliance-matrix.json        # ISO 27001 / SOC 2 / FERPA / COPPA / DPDP matrix
│   └── data-room-index.json          # Institutional procurement data room index
├── scripts/
│   ├── validate_jurisdiction.py      # Validates jurisdiction profiles against schema
│   ├── validate_credentials.py       # Validates credential and anti-gaming rules
│   ├── validate_governance_scheduler.py # Validates governance review schedules
│   └── validate_phase9_gate.py       # Master Phase 9 gate runner
└── tests/
    ├── test_jurisdiction_gate.py     # Jurisdiction unit tests
    ├── test_credential_network.py    # Credential & anti-gaming unit tests
    ├── test_governance_scheduler.py  # Governance scheduler unit tests
    └── test_phase9_e2e.py            # End-to-end gate integration test
```

## Running Verification

```powershell
# Run all Phase 9 unit & integration tests
python -m pytest phase9/tests -v

# Run the Phase 9 Institutional Readiness Gate
python phase9/scripts/validate_phase9_gate.py
```
