# YOUVA-EdAI Testing & Verification Runbook

**Version 2.0 — Quality Assurance & Verification Architecture**

---

## 1. Testing Philosophy & Zero-Hallucination Standard

In compliance with strict educational platform standards, YOUVA-EdAI enforces a strict distinction between:
* **PASS (Executed)**: Test suites and scripts actually executed and validated in the runtime environment.
* **NOT EXECUTED**: Operations prevented by missing external services, hardware constraints, or sandbox limits.
* **FAIL**: Tests that ran and resulted in an assertion failure.

---

## 2. Test Suite Architecture

```
backend/
├── src/
│   ├── common/tests/                # 17 Modular General Spec Suites (UT-GEN-001 - UT-GEN-100)
│   │   ├── config.spec.ts           # Bootstrap, DI, environment configuration
│   │   ├── validation.spec.ts       # DTO validation, oversized payloads, serialization
│   │   ├── errors.spec.ts           # Exception mapping, log redaction
│   │   ├── authorization.spec.ts    # RBAC, ownership, JWT, replay nonces
│   │   ├── pagination.spec.ts       # Cursor pagination, sorting, filtering
│   │   ├── transaction.spec.ts      # Atomic transactions, optimistic locking
│   │   ├── idempotency.spec.ts      # Idempotency deduplication
│   │   ├── events.spec.ts           # Domain events, subscriber isolation
│   │   ├── outbox.spec.ts           # Outbox pattern, retry limits, dead-letter
│   │   ├── cache.spec.ts            # Cache invalidation, mastery bypass
│   │   ├── queue.spec.ts            # Worker queues, backoff, tenant boundaries
│   │   ├── audit.spec.ts            # Tamper-evident audit signatures
│   │   ├── health.spec.ts           # Dependency health, degradation, timeouts
│   │   ├── privacy.spec.ts          # Data minimization, PII isolation
│   │   ├── safety.spec.ts           # Human escalation, AI closure blocking
│   │   ├── tenant-isolation.spec.ts # Query auto-scoping, tenant context
│   │   └── resilience.spec.ts       # External API handling, graceful shutdown
│   └── [domain-modules]/*.spec.ts   # 86 Domain-Specific Unit & Service Tests
│
└── scripts/
    ├── verify-p14.js                # Autonomous Learning OS Verification (45 checks)
    ├── verify-p15.js                # Trusted Credentials & Skills Passport (44 checks)
    ├── verify-p16.js                # Institutional Interoperability Core (45 checks)
    └── verify-general-unit-tests.js # 100 General Unit Test Cases Harness (100 checks)
```

---

## 3. Automated Verification Execution

All verification suites run using standard Node.js without requiring external database containers or network calls:

```bash
cd backend

# Run the 100 General Unit Test Cases Verification Suite
node scripts/verify-general-unit-tests.js

# Run Phase P16 Institutional Interoperability Verification Suite
node scripts/verify-p16.js

# Run Phase P15 Trusted Credentials & Skills Passport Verification Suite
node scripts/verify-p15.js

# Run Phase P14 Trustworthy Autonomous Learning OS Verification Suite
node scripts/verify-p14.js
```

### Verification Results Summary

| Test Suite | Assertions | Result | Key Coverage |
| :--- | :---: | :---: | :--- |
| **General Unit Tests** | 100 / 100 | **100% PASSED** | Bootstrap, validation, logging redaction, RBAC, pagination, transactions, idempotency, outbox, cache, queue, audit, health, privacy, safety, tenants, resilience |
| **Phase P16 Interoperability** | 45 / 45 | **100% PASSED** | SSRF protection, HTTPS enforcement, allowlisting, adapter registry, multi-tenant sync cursors, conflict triage, provenance |
| **Phase P15 Credentials** | 44 / 44 | **100% PASSED** | State machine, eligibility criteria, anti-gaming deduplication, random share tokens, SHA-256 token hashing, zero-PII public endpoint |
| **Phase P14 Autonomous OS** | 45 / 45 | **100% PASSED** | Hard safety filters, next-best-action scoring, tool sandboxing, circuit breaker, decision provenance |

---

## 4. Full Production Pipeline

When deploying to staging or production environments with live PostgreSQL and Redis services:

```bash
cd backend

# 1. Clean install dependencies
npm ci

# 2. Database migrations
npx prisma migrate deploy

# 3. Compile TypeScript
npm run build

# 4. Execute Jest unit tests
npm test -- --runInBand

# 5. Execute E2E integration tests
npm run test:e2e

# 6. Production dependency audit
npm audit --omit=dev
```
