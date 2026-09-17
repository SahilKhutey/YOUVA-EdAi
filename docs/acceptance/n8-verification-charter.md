# YOUVA-EdAI — N8 Independent Verification Charter

## 1. Purpose & Authority

This document defines the formal Independent Verification Charter for Cycle N8 of YOUVA-EdAI. 
The purpose of N8 is to determine whether YOUVA-EdAI operates as claimed when evaluated independently against real system behavior, real user workflows, and defined acceptance criteria.

Governing Operational Invariant:
> **"No safety claim without independent verification."**
> In N8, "implemented" stops being equivalent to "verified."

---

## 2. System Under Test & Frozen Baseline

Independent verification is executed strictly against the frozen release candidate:

| Parameter | Value |
| :--- | :--- |
| **System Under Test** | YOUVA-EdAI Core Platform (Next.js Frontend + NestJS Backend) |
| **Git Commit SHA** | `cce7ef080320e6fb944cd543dd665b4ab4f04693` |
| **Git Branch** | `main` (synchronized with `master` on `origin`) |
| **Backend Runtime** | Node.js v20.x, NestJS v10.x, Prisma ORM v5.x |
| **Frontend Runtime** | Next.js 16.3.5 (Turbopack, App Router, React 19) |
| **Authoritative Database** | PostgreSQL 16 (Relational schemas, transactional integrity) |
| **Cache & Event Layer** | Redis 7.x (Rate limits, sessions, event pub/sub) |
| **AI Providers** | Google Gemini 1.5 Pro / Flash, Local Ollama, Deterministic Rule Fallback |
| **Verification Environment** | Clean Isolated Container Sandbox (Standard Linux / Windows CI) |

No code modifications, dependency alterations, or schema migrations are permitted during verification without an associated formal defect record.

---

## 3. Independent Verification Governance & Separation of Duties

To prevent conflicts of interest, verification authority is strictly partitioned into distinct roles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Product Owner (Final Authority)                    │
│            • Evaluates business risk & pilot cohort readiness          │
│            • Issues formal GO / NO-GO decision                         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
┌──────┴───────────────┐ ┌──────────┴─────────────┐ ┌────────────┴─────────────┐
│  Verification Team   │ │ Safety & Legal Reviews │ │   Engineering Team       │
│ • Independent black- │ │ • Qualified child-     │ │ • Builds and maintains   │
│   box test execution │   safety auditor         │   the codebase             │
│ • Defect logging &   │ │ • DPDP privacy legal   │ │ • Remediates defects     │
│   evidence retention │   evaluator              │ │ • Cannot self-certify    │
│ • Claim validation   │ │ • Curriculum SME       │   safety or readiness      │
└──────────────────────┘ └────────────────────────┘ └──────────────────────────┘
```

The developer is explicitly prohibited from being the sole authority certifying:
* "Security verified"
* "Child safety verified"
* "Pilot ready"
* "Production ready"

---

## 4. Claim Classification Hierarchy

Every technical and operational claim must be assigned one of the following progressive statuses:

| Status | Definition | Criteria |
| :--- | :--- | :--- |
| **`IMPLEMENTED`** | Code is written and merged | Functional unit exists in the codebase |
| **`TESTED`** | Unit/integration tests exist | Automated tests written by developers pass |
| **`VERIFIED`** | E2E integration passes | End-to-end multi-service test suites succeed |
| **`INDEPENDENTLY VERIFIED`** | Evaluated under black-box scrutiny | Separate verification suite confirms claim without trusting internals |
| **`PILOT VALIDATED`** | Confirmed under real cohort conditions | Validated in production pilot with 15–30 live students & teachers |

---

## 5. Scope & Out-of-Scope Areas

### In-Scope for N8 Independent Verification
1. **Authentication & Session Lifecycle**: Valid/invalid logins, lockouts, expired/tampered JWTs, logout invalidation, session revokes.
2. **Multi-Tenancy & Authorization**: Cross-tenant isolation (Tenant A vs Tenant B: students, teachers, parents), IDOR/BOLA attacks, privilege escalations.
3. **DPDP Parental Consent Lifecycle**: Mandatory consent enforcement, unconsented state blocks, revocation impacts, audit correlation.
4. **Authoritative Learning Loop**: Diagnostic $\rightarrow$ BKT mastery updates $\rightarrow$ adaptive activity recommendation $\rightarrow$ attempt processing $\rightarrow$ teacher roster.
5. **Mastery Integrity**: Atomic persistence, rollback on DB failure, deduplication of clientAttemptId, concurrent attempts.
6. **Adaptive Learning**: Demonstrable differentiation across 5 mastery tiers (<0.40, 0.40–0.69, 0.70–0.84, 0.85–0.94, >=0.95).
7. **Teacher Governance**: Roster analytics, intervention review, non-bypassable consequential authorizations.
8. **Parent Control Plane**: Linked child visibility, unlinked rejection, consent review, notification delivery.
9. **Child Safety Closed Loop**: 7 risk categories, escalation triggers, qualified reviewer handoff, strict prohibition of AI closure.
10. **Governed AI Boundary**: Normal tutor, schema validation, timeout/503 circuit trips, prompt injection defense, cross-tenant isolation, token spend caps.
11. **Security & Penetration Testing**: SSRF defenses, SQLi, XSS, payload limits, HMAC audit hash chaining.
12. **Reliability & Controlled DR**: Circuit recovery, transactional outbox poison isolation, backup checksums, database restoration verification.
13. **Browser E2E Journeys**: Complete student, teacher, parent, and safety reviewer browser workflows.
14. **Accessibility (WCAG 2.1 AA)**: Keyboard navigation, focus rings, contrast, ARIA live states, screen reader labels.
15. **Educational Content QA & Instrumentation**: CBSE/NCERT Grade 8 Math alignment, distractor plausibility, SME verification, telemetry data minimization.

### Out-of-Scope for N8 (Deferred to N9/N10)
* Multi-grade cross-curricular expansion (Grade 9–12, Humanities, Science labs).
* Unrestricted self-directed autonomous learning without teacher/parent governance.
* Production commercial billing & Stripe live charges (mock/test-mode verified).
* Global CDN multi-region failover (single-region multi-AZ tested).

---

## 6. Pass/Fail Rules & Defect Classification

A verification case fails if observable behavior deviates from the specification, exposes data cross-tenant, mutates state without authorization, or allows AI to bypass governance.

Defect Severities:
* **`P0 (Critical)`**: Immediate Release Blocker. Cross-tenant leakage, safety bypass, mastery corruption, auth bypass, unauthorized consequential AI action, broken audit ledger.
* **`P1 (High)`**: Release Blocker unless formally mitigated. Major learning, safety, or reliability defect without catastrophic data loss.
* **`P2 (Medium)`**: Non-blocking for closed pilot if workaround exists. Edge-case UI degradation, non-critical latency spike.
* **`P3 (Low)`**: Minor cosmetic or usability defect.
* **`P4 (Trivial)`**: Documentation or wording discrepancy.

---

## 7. Sign-Off Authorities

| Domain | Authority / Signatory | Scope of Review |
| :--- | :--- | :--- |
| **Engineering** | Lead Systems Architect | Architecture, code builds, test pass rates |
| **Security** | Independent Security Reviewer | Penetration testing, SSRF, auth, tenant isolation |
| **Child Safety** | Designated Child Safety Officer | 7 safety categories, human escalation, false pos/neg |
| **Legal / Compliance** | DPDP Compliance Counsel | Parental consent lifecycle, data minimization |
| **Education / Content** | Senior Mathematics SME | Curriculum alignment, difficulty progression, distractors |
| **Operations** | Site Reliability Lead | DR verification, circuit breakers, outbox worker, SLOs |
| **Product Ownership** | Executive Product Owner | Final Pilot GO / NO-GO Decision |
