# YOUVA EdAI — Phase 9: Regulatory Compliance Review Cadence
## Recurring Audit Schedules, Re-Certification Intervals, and Expiry Protocols

---

## 1. Governance Cadence Architecture

To guarantee that compliance never degrades into a one-time launch artifact, YOUVA EdAI enforces automated, recurring compliance recertifications managed by the `InstitutionalGovernanceEngine` (`institutional_governance.py`).

---

## 2. Mandatory Recurring Review Schedule

| Review Class Key | Name | Maximum Permissible Interval | Responsible Role | System Action on Expiry |
|---|---|---|---|---|
| `child_safety_policy_review` | Child Safety & Distress Escalation Protocol Audit | **60 Days** | Chief Child Safety Officer | Escalation alert; blocks new child onboarding |
| `model_drift_bias_audit` | Algorithmic Bias & Model Drift Recertification | **90 Days** | Lead AI Safety Officer | Flags capability in catalog; switches to shadow mode |
| `penetration_testing_security_audit`| External Application Security & Pentest Audit | **180 Days** | Chief Information Security Officer | Data Room lock; high-priority board notification |
| `audit_log_cryptographic_verification`| HMAC Ledger Cryptographic Integrity Check | **7 Days** | Systems Reliability Engineer | Automated daily job; instant failover if hash breaks |
| `sla_incident_retrospective` | Operational SLA Retrospective & Error Budget Review| **30 Days** | VP of Engineering | Engineering sprint allocation freeze |
| `curriculum_alignment_review` | National Curriculum Standards Graph Recertification| **365 Days** | Head of Pedagogical Content | Content version deprecation warning |
| `institutional_compliance_recertification`| Statutory DPDP / FERPA / COPPA Legal Audit | **365 Days** | General Counsel & DPO | Reverts jurisdiction profile status to `suspended` |

---

## 3. Overdue Detection & Automated Escalation

The governance scheduler runs continuously as a scheduled task. If `today - last_completed_date > max_interval_days`:
1. `InstitutionalGovernanceEngine.detect_overdue_reviews()` generates an `OverdueReviewAlert`.
2. High-priority alerts are dispatched to the responsible executive.
3. If an audit remains uncompleted after 14 days of grace, the platform enters **Constrained Institutional Mode**, halting tenant onboarding and new user credentialing until certified compliance is re-established.
