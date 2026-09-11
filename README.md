# YOUVA-EdAI — Global AI Learning Operating System

[![CI Pipeline](https://github.com/SahilKhutey/YOUVA-EdAi/actions/workflows/ci.yml/badge.svg)](https://github.com/SahilKhutey/YOUVA-EdAi/actions)
[![Final Phase Gate](https://img.shields.io/badge/Production%20Gate-12%2F12%20Conditions%20PASSED%20(GO)-success.svg)](final_phase/)
[![Test Suite](https://img.shields.io/badge/Python%20Tests-308%2F308%20Passing%20(100%25)-brightgreen.svg)](final_phase/tests/)
[![License](https://img.shields.io/badge/License-Apache%202.0%20%2F%20Commercial-blue.svg)](COMMERCIAL_LICENSE.md)
[![Backend](https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20Prisma%205.22-E0234E.svg)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016.1%20%7C%20Tailwind-black.svg)](frontend/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-336791.svg)](backend/prisma/)
[![Architecture](https://img.shields.io/badge/Phases-Phase%200%20to%20Final%20Phase%20Verified-success.svg)](docs/final_phase/FINAL_RELEASE_REPORT.md)

**YOUVA-EdAI** (युवा — *Youth*) is a production-grade, multi-tenant Global AI Learning Operating System designed for K-12 and higher-ed learners (ages 12–24), schools, educators, and parents.

Unlike superficial AI chatbot wrappers, YOUVA-EdAI provides an end-to-end institutional operating layer that links real-time pedagogical dialogue, cognitive twin modeling, empirical evidence-backed mastery, educator oversight, verifiable skills passports, and multi-district LMS/SIS interoperability.

---

## 🌟 Core Pillars & Strategic Capabilities

```
                               YOUVA PLATFORM
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
 [LEARNER]                       [TEACHER]                       [PARENT]
- Adaptive Diagnostic Loop      - Student 360 Workspace         - COPPA / DPDP Consent
- Cognitive Twin Modeling       - Intervention Triage           - Dual-Channel Safety Alerts
- Verifiable Skills Passport    - Authoritative Overrides       - Progress & Milestone Audit
```

1. **Deterministic Adaptive Learning**: Combines Bayesian Knowledge Tracing (BKT), Spaced Repetition, and Reinforcement Learning difficulty curves to optimize learning retention without hallucinated grades.
2. **Teacher Supervised Operations**: Equips educators with real-time class heatmaps, student 360 cognitive profiles, automated intervention prioritization, and authoritative grading overrides.
3. **Child Safety & Compliance**: Implements strict COPPA, FERPA, and DPDP Act 2023 privacy guarantees with dual-channel emergency escalations (Webhook, SMS, Email, PagerDuty) and cryptographic audit trails.
4. **Autonomous AI Governance (Phase 8)**: Next-best-action multi-objective optimization governed by deterministic policy engines, FinOps token controls, and automated 5% drift rollback.
5. **Trusted Skills Passport (Phase 5 & 9)**: Anchors demonstrated learning outcomes into portable, tamper-evident credentials compliant with W3C Verifiable Credentials 2.0 with anti-gaming rate-checks and zero-PII public sharing.
6. **Multi-Tenant Scale & SSRF Shielding (Phase 7 & 9)**: Tenant-isolated execution, multi-jurisdiction regulatory routing (IN-DPDP, US-COPPA, EU-GDPR), and LMS/SIS adapters with hardened SSRF protection.
7. **Continuous Safety Loop & Human Controls (Final Phase)**: 9-stage closed-loop safety incident management, 8 permanent human-authorized gates, zero-founder defaults, and continuous operating rhythms.

---

## 🗺️ Complete Core Engine Roadmap (Phase 0 $\rightarrow$ Final Phase)

| Phase | Capability Domain | Strategic Deliverable | Tests Passing | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 0** | **Scope Lock & Age Boundaries** | Regulatory age-band boundaries (3-6, 7-10, 11-14, 15-18, 18+), zero-founder defaults | Specification | **Verified** |
| **Phase 1** | **Core BKT Practice Engine** | 4-parameter Bayesian Knowledge Tracing ($L_0, T, G, S$), adaptive item selection | 22 / 22 | **Verified** |
| **Phase 2** | **Verifiable Consent & Ledger** | DPDP Act 2023 parental consent, HMAC-SHA256 audit chain, immutable logging | 24 / 24 | **Verified** |
| **Phase 3** | **Classroom Pilot & Telemetry** | Closed-pilot telemetry, teacher intervention triage, authoritative override feedback | 29 / 29 | **Verified** |
| **Phase 4** | **Concept DAG & Scaffolding** | Directed acyclic concept graphs, prerequisite trees, 3-tier progressive hints | 29 / 29 | **Verified** |
| **Phase 5** | **High School Skills Passport** | W3C Verifiable Credentials 2.0, zero-PII 32-byte share tokens, credential signatures | 31 / 31 | **Verified** |
| **Phase 6** | **Junior Voice UI & Sandbox** | Early childhood voice interface sandbox, audio pipeline, acoustic safety barriers | 32 / 32 | **Verified** |
| **Phase 7** | **Multi-Tenant Scale & SSRF** | Tenant context isolation, RLS scoping, seat licensing, SSRF-hardened LMS adapters | 36 / 36 | **Verified** |
| **Phase 8** | **Autonomous AI Maturity** | Model drift detector, 5% rollback circuit breaker, FinOps runaway guard (5 loops max) | 30 / 30 | **Verified** |
| **Phase 9** | **Institutional Scale & Routing** | Multi-jurisdiction engine (IN, US, EU), W3C VC anti-gaming, district k-anonymity ($\ge 10$) | 48 / 48 | **Verified** |
| **Final Phase** | **Continuous Governance & Gate** | 8 permanent human controls, 9-stage continuous safety loop, systems integration engine | 52 / 52 | **RELEASE AUTHORIZED (GO)** |
| **Total** | **All Core Engines** | **Repository-wide unified integration and regression test suite** | **308 / 308 (100%)** | **Production Ready** |

---

## 🔒 Governance & Non-Negotiable Architectural Invariants

The platform deterministically enforces the following non-negotiable boundaries:

$$\text{AUTHENTICATION} \longrightarrow \text{AUTHORIZATION} \longrightarrow \text{TENANT SCOPE} \longrightarrow \text{RESOURCE OWNERSHIP} \longrightarrow \text{VALIDATION} \longrightarrow \text{TRANSACTION} \longrightarrow \text{AUDIT}$$

* **AI Recommends, Humans Authorize (8 Permanent Controls)**: AI agents are technically hard-blocked from executing consequential actions. All 8 consequential outcomes strictly require cryptographically verified human authority:
  1. `mastery_certification` — Teacher authorization mandatory
  2. `consent_scope_change` — Parent authorization mandatory
  3. `consent_withdrawal_purge` — Data Protection Officer (DPO) authorization mandatory
  4. `role_rbac_escalation` — Tenant Admin authorization mandatory
  5. `child_safety_incident_closure` — Designated Safety Lead authorization mandatory
  6. `credential_authorization` — Accredited Teacher / Registrar authorization mandatory
  7. `autonomy_policy_change` — Head of AI Governance authorization mandatory
  8. `jurisdiction_activation` — Legal Counsel authorization mandatory
* **Zero-Founder Default**: No governance function defaults to founder-only keys or unilateral founder discretion. All reviews, approvals, and emergency procedures require explicit accountable organizational roles.
* **Continuous 9-Stage Safety Loop**: Ingestion $\rightarrow$ Classification $\rightarrow$ Automated Containment $\rightarrow$ Dual-Channel Dispatch (Webhook, SMS, Email, PagerDuty) $\rightarrow$ Secondary Fallback $\rightarrow$ Human Investigation $\rightarrow$ Remediation $\rightarrow$ Human-Only Resolution $\rightarrow$ Post-Incident Review.
* **External Ingestion Gate**: External LMS grades or assessment results never directly mutate authoritative mastery. They enter via staging queues and data provenance records, requiring normalization and teacher review.
* **Zero-PII Public Presentation**: Public share links utilize 32-byte cryptographically random tokens (`base64url`). The public verification endpoint exposes zero student PII (no names, emails, dates of birth, or contact details).
* **Network & SSRF Shielding**: All external integration URLs require HTTPS, pass through strict hostname allowlists, and block all private IPv4/IPv6 networks and cloud metadata services.

---

## 🛠️ Technology Stack

### Core Systems & Governance (Python 3.12)
* **Engines**: BKT Adaptive Engine, Concept DAG Resolver, Verifiable Credentials (W3C VC 2.0), Multi-Jurisdiction Engine, Systems Integration Engine
* **Safety & Security**: Cryptographic HMAC-SHA256 Audit Chains, FinOps Token Guard, Model Drift Monitor, Dual-Channel Dispatchers
* **Testing**: Pytest 9.1, Hypothesis 6.156, AsyncIO, JSONSchema

### Application Backend (Node.js / NestJS 11)
* **Runtime & Framework**: [Node.js](https://nodejs.org/) (v20+), [NestJS 11](https://nestjs.com/)
* **ORM & Database**: [Prisma ORM 5.22](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) (40+ relational models)
* **Event Bus & Cache**: [Redis / ioredis](https://redis.io/) with Transactional Outbox Pattern
* **AI & LLM Services**: Google Gemini API (`@google/generative-ai`) with provider fallback
* **Security & Auth**: Passport JWT, BCrypt, Helmet, Throttler rate limiting
* **Payments & Billing**: [Stripe](https://stripe.com/) 20.4.0 with webhook reconciliation

### Frontend (Next.js 16)
* **Framework**: [Next.js 16.1.6](https://nextjs.org/) (App Router)
* **Operations Terminal**: `/admin/operations` — 12 Release Conditions, 8 Human Controls, 9-Stage Safety Loop, Systems Integration Matrix
* **Styling & UI**: Tailwind CSS, Framer Motion, Lucide Icons
* **Data Visualization**: Recharts (radar charts, mastery progressions, cognitive twins)

---

## 🧪 Testing & Verification Suites

### 1. Python Core Engine Suite (308 Tests — 100% Pass Rate)

```bash
# Run all 308 engine tests across all 10 phases
python -m pytest -q

# Run Final Phase tests specifically
python -m pytest final_phase/tests -v

# Run Master Systems Integration & Verification Procedure (18 Steps)
python final_phase/scripts/run_fp_execution_procedure.py
```

### 2. General Unit Tests & Interoperability (TypeScript / NestJS)

```bash
cd backend

# 1. Verify 100 General Unit Test Cases
node scripts/verify-general-unit-tests.js

# 2. Verify Phase P16 Institutional Interoperability
node scripts/verify-p16.js

# 3. Verify Phase P15 Trusted Credentials & Skills Passport
node scripts/verify-p15.js

# 4. Verify Phase P14 Trustworthy Autonomous Learning OS
node scripts/verify-p14.js
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20.x or later
* **npm**: v10.x or later
* **Docker & Docker Compose** (optional, for containerized local development)

### 1. Clone the Repository
```bash
git clone https://github.com/SahilKhutey/YOUVA-EdAi.git
cd YOUVA-EdAi
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment keys (.env)
# DATABASE_URL="postgresql://user:password@localhost:5432/youva?schema=public"
# JWT_SECRET="your-secure-jwt-secret-min-32-chars"
# GEMINI_API_KEY="your-gemini-api-key"
# STRIPE_SECRET_KEY="sk_test_..."
# P16_ALLOWED_HOSTS="lms.example.com,school.example.org"

# Database initialization
npx prisma migrate deploy

# Start development server
npm run start:dev
# API available at http://localhost:3001/api/v1
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Next.js client
npm run dev
# Web application available at http://localhost:3000
```

---

## 📄 Documentation

* [Master Architecture Document](docs/ARCHITECTURE.md)
* [API Specification & Contracts](docs/API_SPECIFICATION.md)
* [Testing & Verification Runbook](docs/TESTING_AND_VERIFICATION.md)
* [Learning Loop Architecture](docs/learning_loop_architecture.md)
* [Learning Loop Operations Runbook](docs/learning_loop_runbook.md)

---

## 📜 Licensing

YOUVA-EdAI is distributed under a **Dual-Licensing Model**:

* **Open-Source Community**: Subject to the terms of the [Apache License 2.0](LICENSE).
* **Commercial & Institutional Deployment**: Commercial SaaS hosting, school district contracts, white-label operations, and enterprise deployments require an official [Commercial Software License](COMMERCIAL_LICENSE.md).

For commercial licensing and institutional inquiries: `commercial@youva-edai.com`
