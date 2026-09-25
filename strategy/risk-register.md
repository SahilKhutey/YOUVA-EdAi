# YOUVA-EdAI — Strategy: Master Risk Register & Mitigation Matrix
## Canonical Strategy Document | Phase 0 Scope Lock

**Status:** RATIFIED & LOCKED  
**Date Locked:** 2026-09-25  

---

## 1. Top Identified Programmatic & Technical Risks

| Risk ID | Risk Category | Risk Description | Severity | Likelihood | Mitigation Protocol & Fail-Safe | Owner |
|---|---|---|:---:|:---:|---|---|
| **RSK-01** | **Trust / Adoption** | Teacher bypasses the dashboard and tells students to ignore AI suggestions ("routing-around"). | **CRITICAL** | Medium | Frictionless single-click override; daily in-person developer presence during Week 1; immediate UX simplification. | Product Lead |
| **RSK-02** | **Child Safety** | Student inputs self-harm or severe distress signal into equation scratchpad; system fails to notify human. | **CRITICAL** | Low | Dual-channel notification (WebSocket to teacher + emergency SMS to counselor); hard block on AI incident closure. | Chief Safeguarding Officer |
| **RSK-03** | **Pedagogical** | Content authoring runs behind schedule, leaving working engine with thin question library. | **HIGH** | High | Start content authoring on Day 1 of Phase 1 in parallel with backend; prioritize 50 core items over breadth. | Curriculum Lead |
| **RSK-04** | **Regulatory** | Parent revokes consent; student data remains lingering in Redis cache or relational tables. | **HIGH** | Low | Automated cascade shredder with 24-hour SLA; atomic obfuscation of student UUID; cryptographic purge certificate. | Data Protection Officer |
| **RSK-05** | **Architecture** | Development team succumbs to codebase inertia and prematurely activates unneeded Stripe or LMS code. | **MEDIUM** | High | `PILOT_MODE=true` build flag; CI merge guard blocking PRs touching out-of-scope modules on pilot branches. | Systems Architect |
| **RSK-06** | **AI Hallucination** | LLM dynamic tutor improvises incorrect mathematical guidance or hallucinates non-standard equations. | **HIGH** | Medium | Template-grounded Socratic engine; mathematical facts and hint DAG injected deterministically from verified JSON. | Backend Lead |

---

## 2. Risk Review & Escalation Cadence

This Risk Register is reviewed **weekly** during the active pilot and updated after every incident or teacher debrief. Any risk transitioning to "Active Issue" triggers a formal course-correction checkpoint.
