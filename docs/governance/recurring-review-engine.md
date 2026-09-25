# YOUVA EdAI — Recurring Review Engine Architecture
## Automated Workflow Generation, Multi-Trigger Scheduling, and Escalation

---

## 1. Architectural Purpose

To guarantee that governance survives organizational scaling and staff turnover, YOUVA EdAI deploys an automated **Recurring Review Engine** (`phase9/models/institutional_governance.py`).

The engine transforms abstract policy commitments into deterministic, programmatic workflows:
```
           TRIGGER FIRES (Time / Event / Scale)
                           │
                           ▼
               AUTOMATED TASK GENERATION
                 (Assigned to Chartered Role)
                           │
                           ▼
                 REVIEWER NOTIFICATION
                (PagerDuty / Email Alert)
                           │
                           ▼
                  REVIEW INVESTIGATION
                           │
                           ▼
               EVIDENCE ARTIFACT ATTACHED
               (Signed Audit / Test Report)
                           │
                           ▼
                 FINDINGS REGISTERED
             (Remediation Commits Tracked)
                           │
                           ▼
              INDEPENDENT VERIFICATION CHECK
                           │
                           ▼
                     TASK CLOSED
          (Next Review Scheduled Automatically)
```

---

## 2. Supported Automated Workflows

### 1. Annual Security Recertification Workflow
- **Trigger:** 365 days since last SOC 2 / ISO 27001 audit.
- **System Action:** Generates `TASK-SEC-ANNUAL`, dispatches alerts to CISO, and creates an audit workspace in the Compliance Data Room.
- **Exit Condition:** Signed independent SOC 2 Type II audit report attached with zero open Critical findings.

### 2. New Jurisdiction Ingestion Workflow
- **Trigger:** Creation of a new jurisdiction file (e.g., `phase9/jurisdictions/sg-pdpa.json`).
- **System Action:** Automatically generates statutory compliance tasks assigned to General Counsel and Child Safety Officer; locks profile in `DRAFT` status.
- **Exit Condition:** Both legal and child safety reviews marked `approved: true` in the profile.

### 3. New AI Capability Promotion Workflow
- **Trigger:** Registration of a new capability ID in `autonomy_governance_catalog.json`.
- **System Action:** Automatically initializes shadow mode evaluation and schedules 13 adversarial penetration tests in `phase8/tests/`.
- **Exit Condition:** 5,000 synthetic requests pass with $< 3\%$ drift and zero sandbox escapes.
