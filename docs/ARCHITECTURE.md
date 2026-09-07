# YOUVA-EdAI Master Architecture & System Design Document

**Version 2.0 — Global Learning Operating System**

---

## 1. System Mission & Vision

**YOUVA-EdAI** is a governed, multi-tenant Global AI Learning Operating System designed for learners aged 12–24, schools, teachers, and parents. Unlike isolated "AI tutor" wrappers, YOUVA provides an end-to-end institutional operating layer that links real-time pedagogical dialogue, cognitive twin modeling, evidence-backed mastery, teacher oversight, verifiable credentials, and multi-district interoperability.

### The Fundamental Architectural Principle
$$\text{EVIDENCE} \longrightarrow \text{VERIFICATION} \longrightarrow \text{MASTERY} \longrightarrow \text{POLICY} \longrightarrow \text{CREDENTIAL} \longrightarrow \text{OPPORTUNITY}$$

* **AI Recommends, Humans Authorize**: Consequential decisions (mastery certification, privacy consent, safety resolution, credential issuance) require authoritative human agency (teacher, parent, or institutional administrator).
* **Deterministic Governance**: State transitions, policy evaluations, and cryptographic integrity checks run deterministically on validated server code, never delegated to unbounded LLM heuristics.

---

## 2. High-Level Architecture Diagram

```
                              YOUVA PLATFORM
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
  [LEARNER]                      [TEACHER]                       [PARENT]
Next.js Client                 Dashboard / Ops                 Consent / Safety
      │                              │                              │
      └──────────────────────────────┼──────────────────────────────┘
                                     │
                                     ▼
                          GATEWAY & SECURITY LAYER
                (JWT, RBAC, Rate-Limit, Idempotency, Tenants)
                                     │
                                     ▼
                          APPLICATION MODULE LAYER
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
[LEARNING ENGINE]          [TEACHER OPERATIONS]             [SAFETY & ESCALATION]
- Diagnostic Loops         - Student 360                    - Dual-Channel Alerts
- BKT & Mastery Engine     - Assignment Workspace           - COPPA / FERPA Consent
- Spaced Repetition        - Intervention Prioritization    - Audit Logs
     │                               │                               │
     ├───────────────────────────────┼───────────────────────────────┤
     │                               │                               │
[COGNITIVE TWIN & AI]       [AUTONOMOUS LEARNING OS]        [CREDENTIAL NETWORK]
- Twin Snapshots           - Next-Best-Action Scorer        - Skills Passport
- Agent Sandboxing         - Hard Safety Filters            - Anti-Gaming Deduplication
- Circuit Breaker          - Provenance Signatures          - OpenBadges Adapter
     │                               │                               │
     └───────────────────────────────┼───────────────────────────────┘
                                     │
                                     ▼
                         INTEROPERABILITY CORE (P16)
               (SSRF Hardening, REST Adapters, Data Provenance)
                                     │
                                     ▼
                         DATA & EVENT INFRASTRUCTURE
       ┌─────────────────────────────┼─────────────────────────────┐
       │                             │                             │
 [POSTGRESQL / PRISMA]       [REDIS EVENT BUS]             [OUTBOX WORKERS]
40+ Relational Models         Domain Outbox &              Asynchronous Batch
Multi-Tenant Isolation        Cache Management             Reliable Delivery
```

---

## 3. The 16-Phase Architectural Evolution

| Phase | Subsystem / Capability | Architectural Focus |
| :--- | :--- | :--- |
| **P1** | **Core Learning Loop** | Diagnostic assessment, Bayesian Knowledge Tracing (BKT), adaptive practice, spaced repetition revision. |
| **P2** | **Teacher Operations** | Teacher classroom dashboard, assignment management, intervention tracking, student supervision. |
| **P3** | **Safety & Parent Trust** | COPPA/FERPA compliance, parent consent workflows, dual-channel safety escalation, tamper-evident audit logs. |
| **P4** | **AI Personalization** | Cognitive twin modeling, knowledge graphs, personalized learning pathways, credential mesh. |
| **P5** | **Production Hardening** | Rate-limiting guards, production exception filters, containerization (Docker), security headers (Helmet), observability. |
| **P6** | **Institutional Scale** | Multi-tenant isolation (`TenantContext`), transactional outbox event bus, unified learner state management. |
| **P7** | **Commercial Productization** | Commercial profiles, Stripe billing integration, subscription entitlements, teacher/student onboarding flows. |
| **P8** | **Global Learning Network** | Canonical curriculum graph, multimodal learning policies, deterministic model evaluation & A/B testing. |
| **P9** | **Autonomous Operations** | Bounded AI autonomy, 5% safety drift rollback, FinOps token accounting, self-healing background operations. |
| **P10** | **Global Learning OS** | Digital twin simulation, continuous improvement release gates, privacy-preserving educational research. |
| **P11** | **Verified Learning Network** | Evidence provenance, causal study orchestration, replication checks, institutional outcome proof. |
| **P12** | **Learning Interoperability** | Unified Learner Record (ULR), cross-curriculum translation, portable learning passport standards. |
| **P13** | **Adaptive Learning Operations** | Operational triage, early warning risk detection, teacher workload optimization, closed-loop interventions. |
| **P14** | **Trustworthy Autonomous OS** | Policy decision engine, next-best-action multi-objective scoring, agent sandboxing, AI circuit breakers, decision provenance. |
| **P15** | **Trusted Learning Identity** | Verifiable Skills Passport, OpenBadges 3.0 adapter, anti-gaming evidence deduplication, zero-PII public verification tokens. |
| **P16** | **Institutional Interoperability Core** | Multi-tenant LMS/SIS adapters, SSRF-hardened external ingestion, data provenance tracking, synchronization cursors, conflict triage. |

---

## 4. Key Subsystem Specifications

### 4.1. Autonomous Learning OS (Phase P14)
* **Hard Safety Filters**: Deterministically intercepts and blocks all autonomous attempts to alter consent, change roles, certify mastery, or close safety alerts.
* **Multi-Objective Next-Best-Action Scorer**: Balances learning gain, teacher priority, cognitive load, and risk using empirical scoring functions.
* **Agent Sandboxing**: Constrains AI agents to explicit tool allowlists, maximum step budgets (default 10 steps), and execution timeouts (30s).
* **Resilience**: Exponential backoff with ceilings and circuit breakers tripping to OPEN state after 3 consecutive failures.
* **Decision Provenance**: SHA-256 cryptographic digests anchored to model versions, input contexts, and decision trees.

### 4.2. Trusted Credentials & Skills Passport (Phase P15)
* **Deterministic State Machine**:
  $$\text{DRAFT} \longrightarrow \text{PENDING\_REVIEW} \longrightarrow \text{APPROVED} \longrightarrow \text{ISSUED} \longrightarrow \text{ACTIVE} \longrightarrow \{\text{SUSPENDED}, \text{EXPIRED}, \text{REVOKED}\}$$
* **Anti-Gaming Deduplication**: Hashes and tracks evidence IDs to prevent double-counting assessments across credentials.
* **Zero-PII Public Verification**: Shares credentials via cryptographically random 32-byte tokens (`base64url`). The backend stores only the SHA-256 hash. The public verification endpoint exposes zero student PII (name, email, school are strictly omitted).
* **Portability**: OpenBadges 3.0 / W3C Verifiable Credential standard schema generation.

### 4.3. Institutional Interoperability Core (Phase P16)
* **SSRF Shielding**: Enforces HTTPS, validates hostnames against `P16_ALLOWED_HOSTS`, and strictly blocks all private IPv4/IPv6 networks and cloud metadata services (`metadata.google.internal`, `169.254.169.254`).
* **Non-Negotiable Ingestion Gate**: External LMS grades or assessment results never directly mutate authoritative mastery. Ingestion creates `p16_external_records` and `p16_data_provenance`, requiring validation and teacher review before impacting mastery models.
* **Sync Cursors & Bounded Batches**: Manages cursor-based incremental sync (`p16_sync_cursors`) preventing RAM exhaustion during large-scale district imports.

---

## 5. Global Architectural Invariants

1. **Authentication & Identity**: All operations require JWT authorization; request context maintains authenticated `userId`, `role`, and `tenantId`.
2. **Tenant Scoping**: Queries and commands must strictly execute within the actor's verified tenant scope. Cross-tenant lookups return `NotFoundError` to prevent resource probing.
3. **Audit Immutability**: Privileged actions generate HMAC-SHA256 tamper-evident audit records.
4. **Idempotency**: Sensitive operational endpoints enforce unique `Idempotency-Key` headers, caching results to guarantee single logical execution.
5. **Human Primacy**: AI tutors, recommendations, and agents remain advisory; educators, parents, and authorized institutional supervisors retain final governing authority.
