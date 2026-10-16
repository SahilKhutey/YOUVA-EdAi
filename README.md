# YOUVA-EdAI — Global AI Learning Operating System
## Continuous Evolution, Global Learning Intelligence, Research & Ecosystem Network

[![CI Pipeline](https://github.com/SahilKhutey/YOUVA-EdAi/actions/workflows/ci.yml/badge.svg)](https://github.com/SahilKhutey/YOUVA-EdAi/actions)
[![License](https://img.shields.io/badge/License-Apache%202.0%20%2F%20Commercial-blue.svg)](COMMERCIAL_LICENSE.md)
[![Backend](https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20Prisma%205.22-E0234E.svg)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016.3%20%7C%20Tailwind-black.svg)](frontend/)
[![Truth Baseline](https://img.shields.io/badge/Truth%20Baseline-Measured-informational.svg)](docs/TRUTH_BASELINE.md)

**YOUVA-EdAI** (युवा — *Youth*) is an adaptive educational platform designed for formative practice, mastery learning, and teacher oversight.

---

## 📊 Measured Truth Baseline (Real, Reproducible Figures)

In accordance with the **Truth Ledger**, all claims in this repository must be reproducible via direct terminal commands.
See [docs/TRUTH_BASELINE.md](docs/TRUTH_BASELINE.md) for the verified status:

| Measure | Measured Result | Verification Command |
|---|---|---|
| **Backend TypeScript Errors** | **0 errors** | `cd backend && npx prisma generate && npx tsc --noEmit` |
| **Unit Test Suite (non-e2e)** | **813 passed, 19 failed (179 passing suites)** | `cd backend && npx jest --testPathIgnorePatterns="e2e"` |
| **Clean MVP Branch (`mvp/clean`)** | **95 passed, 0 failed (48 suites passed)** | `git checkout mvp/clean && cd backend && npx jest` |
| **Active Models in Schema** | **196 models** (53 in MVP) | `grep -c '^model ' backend/prisma/schema.prisma` |
| **Active Target Concept** | **Middle School Math: Linear Equations** | See `MVP_SCOPE.md` |

> **Note on Earlier Claims**: The previous mention of "7,971 / 100% GREEN tests" and "civilization infrastructure" was unverified machine-generated documentation. The actual verified unit test suite is 832 tests (non-e2e), with a static block count of ~3,100 including database-dependent e2e tests.


---

## 🛡️ Enterprise Architectural Invariants

* **Data Boundary Invariant**: $\mathbf{\text{Operational Data} \ne \text{Research Data} \ne \text{AI Context} \ne \text{Analytics Data} \ne \text{Credential Evidence}}$.
* **Pedagogical Truth Invariants**:
  - $\mathbf{\text{Mastery} \ne \text{Confidence}}$ (Metacognitive Calibration Index).
  - $\mathbf{\text{Immediate Recall} \ne \text{Long-Term Retention} \ne \text{Transfer Mastery}}$.
* **Model Competition & Promotion**: 8-stage promotion pipeline (`RESEARCH` $\to$ `GA`) with mandatory independent safety reviews and AUC-ROC $\ge 0.75$.
* **Complexity Budget & Stop-The-Line Authority**: Hard Complexity Budget Index ceiling ($\tau = 100$) triggering automated feature freezes, paired with instantaneous circuit-breaker authority.
* **Continuous Adversarial Red Teaming**: 100% containment across AI exfiltration, educational misconceptions, child dependency, and autonomy escalation.

---

## 🛠️ Technology Stack

### Backend Platform (Node.js / NestJS 11 & TypeScript)
* **Architecture**: Modular Monolith with Domain-Driven Design
* **Runtime & Framework**: Node.js v20+, NestJS 11
* **ORM & Datastore**: Prisma ORM 5.22, PostgreSQL (40+ relational schemas), Redis (ephemeral caching & rate limiting)
* **AI Provider Abstraction**: Google Gemini 1.5 Pro / Flash, Anthropic Bedrock, Ollama Local (Gemma 2 9B IT)
* **Security & Auth**: Passport JWT, BCrypt, Timing-Safe HMAC-SHA256 signatures, SSRF protection

### Frontend Applications (Next.js 16 App Router)
* **Framework**: Next.js 16.3 (Turbopack) with 54 static and dynamic routes
* **Evolution Consoles**:
  - `/admin/evolution`: Learning Intelligence Clusters, Research Portfolio Hub, AI Tutor Benchmark, Complexity Budget Console
  - `/research`: Public Learning Science Research & Open Evidence Portal
  - `/admin/governance`: Global Jurisdiction Registry, 10-Step Activation Gates, Executive Governance Dashboard
  - `/admin/autonomy`: Agent Registry Console, Human Authorization Drawer, Safety Scorecard
  - `/trust`: Public Institutional Trust Center with verified claims and subprocessor directory
  - `/verify`: Privacy-preserving selective disclosure credential verification

---

## 🧪 Comprehensive Verification Suites

```bash
# Navigate to backend directory
cd backend

# 1. Run all 4,341 automated E2E tests across all 40 suites (100% green)
npx jest --config ./test/jest-e2e.json

# 2. Run Milestone N17 Evolution & Research suite (510 tests)
npx jest --config ./test/jest-e2e.json n17

# 3. Build verification
npm run build
```

---

## 📄 Formal Documentation & Governance Charters

* [N17 Master Evolution & Release Report](docs/governance/n17-continuous-evolution-report.md) — 25-Section Post-Roadmap Documentation
* [N17 Architecture Charter](docs/governance/n17-continuous-evolution-charter.md) — Evolution Loop, 12 Research Tracks & Complexity Budget
* [N16 Master Governance & Operations Report](docs/governance/n16-institutional-scale-report.md) — 36-Section Institutional Scale Release
* [N16 Architecture Charter](docs/governance/n16-institutional-scale-charter.md) — Permanent Operating Model & Jurisdiction Topology
* [Master Architecture Document](docs/ARCHITECTURE.md)
* [API Specification & Contracts](docs/API_SPECIFICATION.md)

---

## 📜 Licensing

YOUVA-EdAI is distributed under a **Dual-Licensing Model**:
* **Open-Source Community**: Subject to the terms of the [Apache License 2.0](LICENSE).
* **Commercial & Institutional Deployment**: Commercial SaaS hosting, school district contracts, white-label operations, and enterprise deployments require an official [Commercial Software License](COMMERCIAL_LICENSE.md).

For institutional adoption, district procurement, and trust audits: `governance@youva-edai.com`
