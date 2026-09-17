# YOUVA-EdAI Pilot Release Manifest (N9.1)

**Release Identifier**: `YOUVA-PILOT-REL-0.9.0`  
**Evaluation Baseline Commit**: `ca77906`  
**Git Branch**: `main` (fast-forwarded to `master`)  
**Date Frozen**: 2026-09-17  
**Status**: `FROZEN / PRODUCTION-PILOT-LOCKED`  
**Governing Rule**: *After pilot launch, no uncontrolled feature development directly into the pilot environment. All runtime changes require formal Change Request (CR), risk assessment, testing, approval, and cryptographic audit verification.*

---

## 1. System Bill of Materials (SBOM) & Version Coordinates

```
YOUVA-EdAI Pilot Release 0.9.0
├── Git Commit SHA: ca77906b3d4f801691a5e12ec16a7bf5d0137d2f
├── Backend Runtime: NestJS 10.x / Node.js v20.14.0 LTS
├── Frontend Framework: Next.js 14.x / React 18.x (Turbopack)
├── Relational Database: PostgreSQL 16.2 with Tenant RLS
├── In-Memory Store: Redis 7.2.4 (Cache, Token Blocklist, Distributed Locks)
├── Prisma Schema: v5.22.0 (Hash: sha256:8f2a1b9e0c...)
├── Database Migration Version: 20260917_n8_acceptance_baseline
├── Dependency Lockfiles:
│   ├── backend/package-lock.json (Hash: sha256:d8c11e402a...)
│   └── frontend/package-lock.json (Hash: sha256:e3b0c44298...)
├── AI Provider Models:
│   ├── Primary: Google Gemini 1.5 Pro (Model ID: gemini-1.5-pro-002)
│   ├── Fast/Secondary: Google Gemini 1.5 Flash (Model ID: gemini-1.5-flash-002)
│   └── Local Fallback: Socratic Rule Engine v2.0 (In-Memory Deterministic)
├── Prompt Registry: v1.2.0 (SHA-256 HMAC Merkle verified)
├── Educational Content Catalog: v1.0.0 (Grade 8 Mathematics & Science NCERT)
├── Safety Policy Engine: v2.1.0 (Harm Classification & Crisis Routing)
└── Feature Flags:
    ├── PILOT_COHORT_RESTRICTION: true (Restricted to Tenant "tenant-modern-school")
    ├── AI_SOCRATIC_ENFORCEMENT: true (Direct answer filter enabled)
    ├── DPDP_CONSENT_ENFORCEMENT: true (Strict parental consent check enabled)
    ├── CRISIS_AUTO_ESCALATION: true (Immediate session termination on self-harm)
    ├── HIGH_SPEED_RATE_LIMITING: true (100 req/min per IP, 30 AI req/min per user)
    └── COMMERCIAL_EXPANSION_GATES: false (Disabled for closed pilot)
```

---

## 2. Environment Configuration & Deployment Topology

| Parameter | Pilot Configuration | Verification Status |
|:---|:---|:---|
| **Deployment Target** | Multi-tenant isolated staging cluster (VPC isolated) | Verified |
| **Domain** | `https://pilot.youva-edai.internal` | TLS 1.3 Active |
| **PostgreSQL Pool** | Max 30 connections, connection timeout 5000ms | Health Checked |
| **Redis Memory Policy** | `volatile-lru`, maxmemory 512MB | Health Checked |
| **AI Gateway Quota** | $15.00/day tenant ceiling; soft alert at $12.00 | Verified Active |
| **Outbox Dispatcher** | Poll interval 1000ms, batch size 25 events | Health Checked |
| **Audit Chaining** | SHA-256 HMAC chained ledger | Tamper Checked |

---

## 3. Controlled Change Management Protocol (N9.28)

To preserve the empirical validity of pilot evaluation data, any modification to the deployed platform is strictly classified and governed:

### Change Classes & Approval Gateways

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           CHANGE CLASSIFICATION                                │
├──────────┬─────────────────────────────┬───────────────────────────────────────┤
│ Class A  │ No Behavioral Impact        │ Expedited review by Tech Owner        │
│          │ (Documentation, UI typos)   │ Immediate deploy after staging check  │
├──────────┼─────────────────────────────┼───────────────────────────────────────┤
│ Class B  │ Low-Risk Usability          │ Requires Product Owner & Tech Lead    │
│          │ (Button padding, contrasts) │ Staging E2E run required              │
├──────────┼─────────────────────────────┼───────────────────────────────────────┤
│ Class C  │ Learning Behavior           │ Requires Pedagogical Governance Lead  │
│          │ (Adaptive logic, rubric)    │ Pre/post cohort data separation req.  │
├──────────┼─────────────────────────────┼───────────────────────────────────────┤
│ Class D  │ Safety, Security & Schema   │ Unanimous 5-Authority Approval        │
│          │ (DB schema, auth, safety)   │ Full regression + DR drill required   │
└──────────┴─────────────────────────────┴───────────────────────────────────────┘
```

### Change Execution Workflow
1. **Change Request (CR)** logged in `docs/pilot/change-requests/`.
2. **Risk Assessment** conducted against educational continuity and data integrity.
3. **Formal Approval** executed by authorized role representative.
4. **Automated Testing**: Targeted E2E test suite + full platform regression.
5. **Deployment & Verification**: Staged release with zero downtime; cryptographic audit record appended.
