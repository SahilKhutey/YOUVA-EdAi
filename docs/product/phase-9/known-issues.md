# YOUVA EdAI — Phase 9: Known Issues & Institutional Technical Debt Register
## Operational Constraints, Long-Term Technical Debt, and Mitigation Controls

---

## 1. Overview

This document maintains the active technical debt and operational constraints identified during Phase 9 institutional governance maturation. None of these items represent safety, security, or legal compliance blockers, but all are prioritized in the ongoing engineering backlog.

---

## 2. Active Technical Debt Register

| ID | Subsystem | Issue Summary | Severity | Current Mitigation | Target Milestone |
|---|---|---|---|---|---|
| **ISS-P9-01** | District Reporting | Aggregation queries across large districts (> 50,000 students) incur 1.8s latency without pre-warmed Redis cache. | Low | Asynchronous nightly materialization of cohort competency cubes. | Q1 Institutional Release |
| **ISS-P9-02** | Credential Engine | Public verification QR code generation uses client-side canvas rendering on older Android 8 devices. | Low | Server-side SVG rendering fallback added for legacy mobile browsers. | Closed & Verified |
| **ISS-P9-03** | Jurisdiction Engine | Dynamic geo-IP resolution can occasionally misidentify corporate VPN endpoints in cross-border school networks. | Medium | Tenant explicit jurisdiction override takes precedence over geo-IP (`tenantOverrideAllowed: true`). | Standard Operating Procedure |
| **ISS-P9-04** | Data Room | PDF document viewing in browser requires canvas worker download on low-bandwidth school networks. | Low | Progressive loading with text-first preview rendering. | Q2 Portal Enhancement |
| **ISS-P9-05** | Governance Scheduler | In-memory overdue alerts dispatched via stdout log in development mode. | Low | Integration with enterprise PagerDuty and SendGrid email notifications in production deployment. | Infrastructure Pipeline |

---

## 3. Long-Term Architectural Discipline Invariant

Phase 9 establishes the final institutional invariant governing technical debt:
> **No technical debt may be accrued by weakening safety invariants, diluting parental consent controls, or bypassing human teacher authorization.**
All accepted technical debt must be strictly confined to performance optimizations, caching strategies, or user interface refinements.
