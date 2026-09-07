# YOUVA-EdAI — Global AI Learning Operating System

[![CI Pipeline](https://github.com/SahilKhutey/YOUVA-EdAi/actions/workflows/ci.yml/badge.svg)](https://github.com/SahilKhutey/YOUVA-EdAi/actions)
[![License](https://img.shields.io/badge/License-Apache%202.0%20%2F%20Commercial-blue.svg)](COMMERCIAL_LICENSE.md)
[![Backend](https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20Prisma%205.22-E0234E.svg)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016.1%20%7C%20Tailwind-black.svg)](frontend/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-336791.svg)](backend/prisma/)
[![Architecture](https://img.shields.io/badge/Phases-P1%20to%20P16%20Complete-success.svg)](docs/ARCHITECTURE.md)

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
- Adaptive Diagnostic Loop      - Student 360 Workspace         - COPPA / FERPA Consent
- Cognitive Twin Modeling       - Intervention Triage           - Dual-Channel Safety Alerts
- Verifiable Skills Passport    - Authoritative Overrides       - Progress & Milestone Audit
```

1. **Deterministic Adaptive Learning**: Combines Bayesian Knowledge Tracing (BKT), Spaced Repetition, and Reinforcement Learning difficulty curves to optimize learning retention without hallucinated grades.
2. **Teacher Supervised Operations**: Equips educators with real-time class heatmaps, student 360 cognitive profiles, automated intervention prioritization, and authoritative grading overrides.
3. **Child Safety & Compliance**: Implements strict COPPA, FERPA, and GDPR-K privacy guarantees with dual-channel emergency escalations and cryptographic audit trails.
4. **Autonomous Learning OS (Phase P14)**: Next-best-action multi-objective optimization governed by deterministic policy engines and hard safety filters that block unauthorized AI mutations.
5. **Trusted Skills Passport (Phase P15)**: Anchors demonstrated learning outcomes into portable, tamper-evident credentials compliant with OpenBadges 3.0 and W3C Verifiable Credentials with zero-PII public sharing.
6. **Institutional Interoperability (Phase P16)**: Multi-tenant LMS/SIS adapters with Server-Side Request Forgery (SSRF) hardening, data provenance tracking, and synchronization cursors.

---

## 🗺️ Complete Architectural Roadmap (Phases P1 $\rightarrow$ P16)

| Phase | Capability Domain | Strategic Purpose | Status |
| :--- | :--- | :--- | :---: |
| **P1** | **Core Learning Loop** | Diagnostic assessment, Bayesian Knowledge Tracing (BKT), adaptive practice, spaced repetition. | **Verified** |
| **P2** | **Teacher Operations** | Classroom workspaces, student supervision, assignment distribution, intervention tracking. | **Verified** |
| **P3** | **Safety & Parent Trust** | COPPA/FERPA consent lifecycle, dual-channel escalation, immutable audit logging. | **Verified** |
| **P4** | **AI Personalization** | Cognitive twin modeling, knowledge graphs, personalized learning pathways, credential mesh. | **Verified** |
| **P5** | **Production Hardening** | Rate-limiting guards, production exception filters, containerization, security headers, metrics. | **Verified** |
| **P6** | **Institutional Scale** | Multi-tenant isolation (`TenantContext`), transactional outbox event bus, unified learner state. | **Verified** |
| **P7** | **Commercial Operations** | Commercial tenant profiles, Stripe subscription billing webhooks, entitlement enforcement. | **Verified** |
| **P8** | **Global Learning Network** | Canonical curriculum graph, multimodal learning policies, deterministic A/B testing. | **Verified** |
| **P9** | **Autonomous Operations** | Bounded AI autonomy, 5% safety drift rollback, FinOps token accounting, self-healing jobs. | **Verified** |
| **P10** | **Global Learning OS** | Digital twin simulation, continuous improvement release gates, privacy-preserving research. | **Verified** |
| **P11** | **Verified Learning Network** | Evidence provenance, causal study orchestration, replication verification, institutional proof. | **Verified** |
| **P12** | **Learning Interoperability** | Unified Learner Record (ULR), cross-curriculum translation, portable learning passports. | **Verified** |
| **P13** | **Adaptive Learning Operations** | Operational triage, early warning risk detection, teacher workload optimization. | **Verified** |
| **P14** | **Trustworthy Autonomous OS** | Policy decision engine, next-best-action scoring, agent sandboxing, AI circuit breakers. | **Verified** |
| **P15** | **Trusted Learning Identity** | Verifiable Skills Passport, OpenBadges 3.0, anti-gaming deduplication, zero-PII share tokens. | **Verified** |
| **P16** | **Institutional Interoperability Core** | Multi-tenant LMS/SIS adapters, SSRF-hardened ingestion, data provenance, sync cursors. | **Verified** |

---

## 🔒 Governance & Non-Negotiable Architectural Invariants

The platform deterministically enforces the following non-negotiable boundaries:

$$\text{AUTHENTICATION} \longrightarrow \text{AUTHORIZATION} \longrightarrow \text{TENANT SCOPE} \longrightarrow \text{RESOURCE OWNERSHIP} \longrightarrow \text{VALIDATION} \longrightarrow \text{TRANSACTION} \longrightarrow \text{AUDIT}$$

* **AI Recommends, Humans Authorize**: Consequential actions—certifying topic mastery, modifying student privacy consent, altering user roles, and closing safety incidents—**strictly require human authority**. AI agents are hard-blocked by software policy from performing these operations.
* **External Ingestion Gate**: External LMS grades or assessment results never directly mutate authoritative mastery. They enter via `p16_external_records` and `p16_data_provenance`, requiring normalization and teacher review.
* **Zero-PII Public Presentation**: Public share links utilize 32-byte cryptographically random tokens (`base64url`). The public verification endpoint exposes zero student PII (no names, emails, dates of birth, or home contacts).
* **Network & SSRF Shielding**: All external integration URLs require HTTPS, pass through strict hostname allowlists (`P16_ALLOWED_HOSTS`), and block all private IPv4/IPv6 networks and cloud metadata services.

---

## 🛠️ Technology Stack

### Backend
* **Runtime & Framework**: [Node.js](https://nodejs.org/) (v20+), [NestJS 11](https://nestjs.com/)
* **ORM & Database**: [Prisma ORM 5.22](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) (40+ relational models)
* **Event Bus & Cache**: [Redis / ioredis](https://redis.io/) with Transactional Outbox Pattern
* **AI & LLM Services**: Google Gemini API (`@google/generative-ai`)
* **Security & Auth**: Passport JWT, BCrypt, Helmet, Throttler rate limiting
* **Payments & Billing**: [Stripe](https://stripe.com/) 20.4.0 with webhook reconciliation
* **Real-Time Communication**: [Socket.IO 4.8](https://socket.io/)

### Frontend
* **Framework**: [Next.js 16.1.6](https://nextjs.org/) (App Router)
* **Styling & UI**: Tailwind CSS, Framer Motion, Lucide Icons
* **Data Visualization**: Recharts (radar charts, mastery progressions, cognitive twins)
* **Client Networking**: Axios with tenant-interceptors and JWT refresh flows

---

## 🧪 Testing & Verification Suites

The repository contains both domain-specific suites and a comprehensive **100 General Unit Test Cases** suite:

```
backend/
├── src/common/tests/            # 17 Spec Files (UT-GEN-001 through UT-GEN-100)
│   ├── config.spec.ts           # Bootstrap, DI, environment validation
│   ├── validation.spec.ts       # DTO validation, oversized payload checks, serialization
│   ├── errors.spec.ts           # Exception mapping, log redaction of secrets
│   ├── authorization.spec.ts    # RBAC, resource ownership, JWT validation, nonces
│   ├── pagination.spec.ts       # Deterministic cursor pagination, sorting, filtering
│   ├── transaction.spec.ts      # Atomic transactions, optimistic concurrency
│   ├── idempotency.spec.ts      # Idempotent operation caching
│   ├── events.spec.ts           # Domain event dispatch & subscriber isolation
│   ├── outbox.spec.ts           # Transactional outbox, retries, dead-letter state
│   ├── cache.spec.ts            # Cache hit/miss, invalidation, mastery cache bypass
│   ├── queue.spec.ts            # Job queues, worker tenant boundaries, backoff
│   ├── audit.spec.ts            # Tamper-evident HMAC-SHA256 audit signatures
│   ├── health.spec.ts           # Multi-dependency health checks, degradation
│   ├── privacy.spec.ts          # Data minimization, PII isolation
│   ├── safety.spec.ts           # Safety incident escalation, AI closure blocking
│   ├── tenant-isolation.spec.ts # Auto-scoping queries to active tenant context
│   └── resilience.spec.ts       # External API handling, graceful shutdown
└── scripts/
    ├── verify-general-unit-tests.js  # 100/100 General Unit Tests Verified (100%)
    ├── verify-p16.js                 # 45/45 P16 Interoperability Checks Verified (100%)
    ├── verify-p15.js                 # 44/44 P15 Credential Network Checks Verified (100%)
    └── verify-p14.js                 # 45/45 P14 Autonomous Learning Checks Verified (100%)
```

### Running Verification Locally

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
