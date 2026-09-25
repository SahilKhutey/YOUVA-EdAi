# YOUVA EdAI — Phase 7: Known Issues & Technical Debt Register
## Post-Scale Deficiencies, Scaling Thresholds, and Phase 8 Transition Boundaries

---

## 1. Technical Debt & Operational Issues Register

| Defect ID | Severity | Component | Description & Architectural Impact | Remediation Plan |
|---|---|---|---|---|
| **DEBT-P7-01** | Medium | PgBouncer Pool | **Connection Saturation Ceiling**: Concurrency tests revealed connection pool saturation at ~1,650 concurrent users (max 80 connections). While sufficient for current committed 250 seats, multi-school clusters will require higher limits. | Increase `max_client_conn` to 200 and enable transaction-mode pooling across RDS read replicas during Phase 8. |
| **DEBT-P7-02** | Low | `lms_connector.py` | **Full-Roster Pull Overhead**: The current LMS sync fetches complete course rosters rather than incremental changes. For schools $> 1,000$ students, sync jobs take $> 45\text{s}$. | Implement RFC 7644 SCIM 2.0 or OneRoster delta-token query parameters. |
| **DEBT-P7-03** | Low | Tenant Provisioning | **CLI-Based School Seeding**: Provisioning a new institutional tenant requires executing `python phase7/scripts/seed_tenants.py` by platform operations staff. | Build self-service multi-tenant onboarding wizard into Institutional Admin Console. |
| **DEBT-P7-04** | Low | B2C Invoicing | **Deferred Consumer Billing**: B2C Stripe subscription models remain dormant in codebase. | Re-evaluate consumer subscription demand gate during Phase 8 market review. |

---

## 2. Permanent Architectural Boundary: Phase 8 Transition

Phase 7 has proven that YOUVA EdAI scales responsibly:
- Data is strictly partitioned across tenants.
- Commercial seat limits prevent runaway resource consumption.
- LMS integrations are sealed against SSRF attacks.
- The human teacher remains the non-negotiable pedagogical authority.

Phase 8 will introduce **Autonomous AI Agents & System Maturation**, which must strictly inherit the multi-tenant isolation, human authorization, and safety containment validated in Phases 1–7.
