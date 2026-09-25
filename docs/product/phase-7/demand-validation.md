# YOUVA EdAI — Phase 7: Demand Validation Gate & Audit
## Systematic Demand-Gating Evaluation for Enterprise Infrastructure Investments

---

## 1. The Demand Governance Rule

> [!IMPORTANT]
> **"P6 / P7 / P16 IS ALREADY IMPLEMENTED" IS NOT EVIDENCE OF DEMAND.**
> 
> Code existing in the repository does not justify operational deployment, server provisioning, security liability, or compliance exposure.
> 
> Only **formal customer contracts, signed procurement agreements, or committed user populations** constitute valid evidence to activate infrastructure.

---

## 2. Infrastructure Investment Demand Assessment Matrix

| Evaluation Field | Investment 1: Multi-Tenancy (P6) | Investment 2: B2B School Licensing (P7) | Investment 3: LMS/SIS Connector (P16) | Investment 4: B2C Consumer Billing (P7) |
|---|---|---|---|---|
| **Customer / Problem** | Institutional school isolation required for data privacy | School admin requires seat quota enforcement & automated provisioning | School IT requires roster sync from on-prem SIS / Canvas LMS | Direct-to-consumer family subscriptions |
| **Documented Evidence** | Signed contract: `CONTRACT-DPSRKP-2026-SCALE` | Section 4 of `CONTRACT-DPSRKP-2026-SCALE` | Section 7 of `CONTRACT-DPSRKP-2026-SCALE` (`allowedLmsHosts`) | No consumer marketing launched; 0 waitlist commitments |
| **Affected Population** | 250 students, 12 teachers, 2 administrators | 250 licensed seats across Class 8 & 10 | Class 10 mathematics cohort roster | 0 paying consumer accounts |
| **Revenue / Procurement** | Committed enterprise ARR contract (DPS Society) | Tied directly to seat license invoicing | Prerequisite for institutional procurement renewal | None currently |
| **Current Workaround** | Single-school manual deployment from Phase 3 & 5 | Manual database seeding of student accounts | Manual CSV roster import by primary investigator | None required |
| **Required Deadline** | August 1, 2026 (Academic Term Start) | August 1, 2026 | September 15, 2026 (Mid-term sync) | N/A |
| **Infrastructure Requested**| Server-side RLS, tenant-scoped caching & job queues | `LicensingEngine`, webhook idempotency, seat ceiling | `LMSConnector`, SSRF perimeter firewall | Stripe recurring subscriptions & checkout |
| **Existing Capability** | Basic tenant model in `backend/src/tenants` | Partial Stripe service in `commercial/` | Raw REST connector in `interoperability/` | Prototype billing service |
| **Identified Gap** | Missing cache key scoping, queue message cross-talk | Missing seat quota hard stop and contract binding | Vulnerable to SSRF without hostname allowlist | Complete B2C churn/dunning logic |
| **Decision** | **MODIFY & HARDEN (ACTIVE)** | **BUILD & HARDEN (ACTIVE)** | **DEMAND-GATED ON-DEMAND (ACTIVE)** | **DEFER (DORMANT)** |
| **Accountable Owner** | Lead Security Architect | Head of Enterprise Billing | Interoperability Lead | Product Lead |

---

## 3. Demand Validation Summary

1. **B2B School Tenancy & Licensing**: **ACTIVATED**. Formally backed by 250 committed seats from Delhi Public School, R.K. Puram.
2. **LMS/SIS On-Demand Sync**: **ACTIVATED WITH GATES**. Restricted strictly to 3 pre-cleared hostnames (`canvas.dpsrkp.net`, `moodle.dpsrkp.net`, `sis.dpsrkp.edu.in`).
3. **B2C Consumer Billing**: **DEFERRED**. Preserved in dormant state; zero recurring infrastructure provisioned until validated consumer acquisition demand is proven.
