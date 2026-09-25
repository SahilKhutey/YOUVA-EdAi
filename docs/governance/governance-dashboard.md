# YOUVA EdAI — Governance Status Dashboard Specification
## Authoritative Evidence Reporting, Subsystem Telemetry, and Anti-Single-Score Principles

---

## 1. Governance Principle: Rejecting the "Single Safety Score"

In high-stakes educational governance, composite "single safety scores" (e.g., *"Overall Safety: 94%"*) are inherently misleading:
> **A single percentage score obscures critical vulnerabilities. A system with a 99% average score is fundamentally unsafe if its child distress escalation queue or cross-tenant isolation is failing.**

The YOUVA Governance Status Dashboard reports **multivariate evidence status across explicit operational dimensions**, requiring independent passes across all critical safeguards.

---

## 2. Canonical Dashboard Output Format

The live dashboard is generated programmatically by `governance/scripts/verify_execution_control.py`:

```
==================================================
YOUVA GOVERNANCE STATUS DASHBOARD
==================================================
Timestamp:                 2026-09-25T02:17:38Z
Active Jurisdictions:      2 (in-dpdp, us-coppa-ferpa)
Active Tiers:              3 (Early Learner, Middle School, High School)
Active Tenants:            10 (DPS, Modern School, KV Network, etc.)
Active AI Capabilities:    2 (CAP-001 Hint Tiering, CAP-002 Difficulty)
--------------------------------------------------
Security Review
  Last Completed:          2026-09-25
  Next Scheduled:          2026-12-25 (Quarterly Dependency & Access Scan)
  Status:                  CURRENT (PASS)
--------------------------------------------------
Child Safety Review
  Last Completed:          2026-09-25
  Next Scheduled:          2026-11-25 (Bi-Monthly Safeguarding SLA Audit)
  Status:                  CURRENT (PASS)
--------------------------------------------------
AI Governance
  Active Capabilities:     2 (CAP-001, CAP-002)
  Suspended Capabilities:  1 (CAP-003 Mastery Certification Blocked)
  Revalidation Required:   0
--------------------------------------------------
Credentials (W3C VC 2.0 / Open Badges 3.0)
  Issued:                  1,420
  Revoked:                 3 (Academic integrity remediation)
  Verification Errors:     0
--------------------------------------------------
Risk & Findings Register
  Open Critical Findings:  0
  Open High Findings:      0
  Accepted Technical Debt: 5 (Tracked in known-issues.md)
--------------------------------------------------
Core Operational Health Checks
  Consent Integrity:       PASS (Verifiable Parental Consent & 24h Purge)
  Tenant Isolation:        PASS (Database RLS & Tool Boundary Defense)
  Safety Escalation:       PASS (Independent of LLM Status, < 4h SLA)
  Provider Failover:       PASS (Primary -> Secondary -> Deterministic Cache)
  Audit Integrity:         PASS (HMAC-SHA256 Unbroken Cryptographic Chain)
==================================================
OVERALL PLATFORM READINESS: 100.0% (BASELINE CERTIFIED)
==================================================
```

---

## 3. Data Integration & Refresh Cadence

- **Real-Time Integration:** Core operational health checks (Tenant Isolation, Safety Escalation, Provider Failover, Audit Integrity) are evaluated via automated synthetic health checks every 60 seconds.
- **Review Cadence Tracking:** The dashboard dynamically compares `lastCompletedDate` against statutory intervals defined in `InstitutionalGovernanceEngine.MANDATORY_REVIEW_CLASSES`. If any review is overdue, the status immediately flips to `OVERDUE (BLOCK)`.
