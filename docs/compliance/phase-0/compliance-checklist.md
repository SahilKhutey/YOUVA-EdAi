# Phase 0 Compliance Requirement Matrix

| Requirement | Applies? | Legal Basis | Engineering Impact | Owner | Evidence | Status |
|---|:---:|---|---|:---:|---|:---:|
| **Child/Guardian Consent** | YES | DPDP Act s.9(1) / Rules | Verifiable Parental Consent lifecycle (OTP/SMS & School DPA) | Compliance | Pending Counsel Review | **OPEN** |
| **Data Collection Limitation** | YES | DPDP Act s.6 & s.9 | Strict pseudonymization; zero biometric, location, or telemetry tracking | Privacy | Pending Data Model Audit | **OPEN** |
| **Data Deletion / Erasure** | YES | DPDP Act s.12(3) | Cascade data shredder deleting student records within 24h of consent revocation | Engineering | Pending Architecture Review | **OPEN** |
| **Access Controls & Isolation** | YES | DPDP Act s.8(5) | Tenant isolation, RBAC, strict role guards preventing unauthorized access | Security | Pending Pen-Test Review | **OPEN** |
| **Incident / Breach Handling** | YES | DPDP Act s.8(6) & CERT-In Rules | 6-hour security incident notification protocol & audit logging | Security | Pending Ops Runbook | **OPEN** |
| **AI Processing Disclosure** | YES | DPDP Act s.5 / Transparency | Clear disclosure to parent and student that AI generates Socratic guidance | Product | Pending UX Copy Review | **OPEN** |
| **Third-Party Processors** | YES | DPDP Act s.8(1) & s.8(2) | Zero Data Retention (ZDR) DPA with LLM API providers; prompt training ban | Legal | Pending Vendor Contract | **OPEN** |

## Status Values
- `OPEN`: Requirement identified; scope and legal interpretation under counsel review.
- `IN_PROGRESS`: Engineering implementation or contract negotiation underway.
- `VERIFIED`: Confirmed by legal counsel and tested with technical audit.
