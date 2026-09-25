# YOUVA EdAI — Phase 7: Demand-Gated Scale Scope Lock
## Canonical Scope Definition, Commercial Invariants, and Infrastructure Activation Boundaries

---

## 1. Executive Summary & Core Principle

Phase 7 governs the institutional scaling and commercial infrastructure of YOUVA EdAI.

### The Governing Architectural Principle
> **Scale only what validated demand requires, and independently verify every security-critical scale boundary before real customer expansion.**

The activation of enterprise modules (P6 Multi-Tenancy, P7 Commercial Licensing, P16 LMS/SIS Interoperability) is strictly gated by **signed customer commitments with verified commercial necessity**, rather than their technical availability in the repository.

```
                    DEMAND GATE
                         │
             ┌───────────┴───────────┐
             │                       │
            B2B                     B2C
             │                       │
       Institutional              Family
        requirements             requirements
             │                       │
      ┌──────┼───────┐          ┌────┼─────┐
      ↓      ↓       ↓          ↓    ↓     ↓
   Tenant  License  LMS/SIS   Billing Entitlement
   Scale   Mgmt     On-demand   │
      │                         │
      └──────────┬──────────────┘
                 ↓
          Operational Layer
                 ↓
        Safety + Support + Audit
```

---

## 2. Locked Scope Contract (Phase 7 Baseline)

| Dimension | Specification | Hard Invariant / Boundary |
|---|---|---|
| **Phase Mandate** | Demand-Gated Institutional Scale | Zero infrastructure activated without documented commercial demand. |
| **Primary Commercial Anchor** | B2B Institutional School Contract | **Delhi Public School, R.K. Puram (`CONTRACT-DPSRKP-2026-SCALE`)** |
| **Committed Institutional Seats**| 250 Active Student Seats | Hard ceiling enforced in database; overflow rejected. |
| **SLA Commitment** | 99.9% Monthly Availability | Documented in contract; backed by APM uptime monitors. |
| **Multi-Tenancy Model** | Logical Row-Level Security (RLS) | Server-side `TenantContext`; non-negotiable query scoping. |
| **B2C Activation Status** | **DORMANT / DEFERRED** | B2C Stripe consumer billing remains unactivated pending consumer marketing rollout. |
| **LMS/SIS Interoperability** | **DEMAND-GATED ON-DEMAND** | Only hostnames explicitly allowlisted in contract (`canvas.dpsrkp.net`, `moodle.dpsrkp.net`, `sis.dpsrkp.edu.in`) are accessible. |
| **The Master Pedagogical Invariant** | **No Direct External Mastery Mutations** | External SIS grades can **NEVER directly mutate BKT knowledge states**. External data is imported as unverified evidence requiring teacher sign-off. |
| **Data Protection Jurisdiction** | India (DPDP Act 2023 §9) | Zero cross-tenant data leakage; tenant-isolated audit chains. |
| **Disaster Recovery Targets** | RPO $< 15\text{ mins}$, RTO $< 60\text{ mins}$ | Daily automated database snapshots with tested cold-restore procedure. |

---

## 3. Formal Scope Sign-Offs

```
[Founder & System Architect]
Name: Dr. Arvind Patel (YOUVA-EdAi Core Leadership)
Decision: APPROVED | Date: 2026-08-01T10:00:00Z

[Institutional Customer Signer]
Name: Padma Bandopadhyay (Principal, Delhi Public School, R.K. Puram)
Decision: APPROVED | Date: 2026-07-28T10:30:00Z

[Director of Educational Technology]
Name: Dr. Alok Verma (DPS R.K. Puram EdTech Directorate)
Decision: APPROVED | Date: 2026-07-28T11:15:00Z

[Data Privacy & Security Counsel]
Name: Adv. Rajesh Nair (EdTech Legal & DPDP Compliance Advisory)
Decision: APPROVED | Date: 2026-08-01T14:30:00Z
```
