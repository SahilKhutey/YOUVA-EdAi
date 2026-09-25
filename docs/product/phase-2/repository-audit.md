# Phase 2 (P3) Repository & Security Audit

**Execution Date:** 2026-09-25  
**Audit Scope:** Deep empirical inspection of Trust, Safety, Consent, Audit Logging, RBAC, and Escalation across Python (`phase2/`) and NestJS/Next.js (`backend/`, `frontend/`).  
**Auditor Operating Principle:** Existing green tests and self-reported "100% verified" claims are treated as evidence, not proof.

---

## 1. Executive Summary

This audit evaluates the codebase's existing Trust & Safety implementations against the Phase 2 Production Specification. 

The repository exhibits a significant divergence:
1. **Python Layer (`phase2/`):** Contains fully self-contained in-memory simulations of Verifiable Parental Consent (VPC), 24h data purges, HMAC-SHA256 forward-chained audit ledgers, and dual-channel safety escalation. All 21 pytest tests pass in 0.95s. However, this is an in-memory test harness with zero connection to the production database or HTTP endpoints.
2. **Production Backend Layer (`backend/src/`):** Implements `ConsentService`, `AuditService`, `SafetyEscalationService`, `TenantsService`, and `ScopeAuthorizationService`. While foundational security primitives (such as blocking AI from closing safety incidents) are implemented in code, critical vulnerabilities and gaps exist:
   - **Audit ledger tests (`audit.spec.ts`) mock all database calls** and do not test hash chaining or adversarial tampering.
   - **Consent OTPs are stored in volatile in-memory Maps**, lost on application restart.
   - **Data deletion (`executePurge`) only redacts the `User` table**, leaving practice sessions, answers, and mastery states orphaned and unscrubbed.
   - **`npm test -- tenants.spec.ts` fails** due to mock-to-service field naming discrepancies (`mastery` vs `masteryProbability`).
   - **Frontend safety dashboards are cluttered with synthetic scores** rather than presenting an actionable, uncluttered teacher alert card.

---

## 2. Component Classification Matrix

| Component | Exists | Actually Works | Tested | Independently Verified | Decision | Core Architectural Findings |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Consent** | YES | PARTIAL | PARTIAL | NO | **REFACTOR & TEST** | Python has working in-memory state machine. Backend `ConsentService` stores OTP challenges in an in-memory `Map`, which is lost on container restart. `consent.service.spec.ts` does not exist in backend. |
| **Parent Verification** | YES | PARTIAL | PARTIAL | NO | **AUDIT & HARDEN** | Relies on pre-existing `ParentStudent` database rows. No external third-party verification (DigiLocker/SMS gateway) is integrated; OTP is mocked in non-production. |
| **Withdrawal** | YES | PARTIAL | PARTIAL | NO | **REFACTOR & ENFORCE** | Revocation marks `ConsentRecord` as `REVOKED` and calculates purge timestamp. However, it does not revoke active JWT sessions, invalidate student refresh tokens, or immediately halt in-flight student practice. |
| **Data Deletion** | YES | PARTIAL | PARTIAL | NO | **REPLACE & REDESIGN** | `executePurge` only redacts `User.name` and `User.email`. Student answers (`UserAnswer`), sessions (`PracticeSession`), and mastery records (`UserTopicMastery`) remain unscrubbed in the database. |
| **Audit HMAC** | YES | PARTIAL | PARTIAL | NO | **REFACTOR & ADVERSARIAL TEST** | Backend `recordChained` exists, but `audit.spec.ts` only tests basic `record` with Prisma mocks. No test verifies chain integrity or simulates malicious tampering (payload alteration, deleted records, broken previous hash). Unordered JSON stringification creates potential verification instability. |
| **RBAC** | YES | YES | YES | NO | **REUSE & HARDEN** | `RolesGuard` and `ScopeAuthorizationService` enforce role boundaries and teacher-student scope. Adversarial privilege-escalation tests need to be consolidated in an automated security suite. |
| **Tenant Isolation** | YES | PARTIAL | PARTIAL | NO | **FIX & ENFORCE** | `TenantGuard` and `TenantContext` exist, but `npm test -- tenants.spec.ts` currently fails due to mock field mismatches. Many learning endpoints do not yet apply `TenantGuard`. |
| **Safety Escalation** | YES | YES | PARTIAL | NO | **REUSE & INTEGRATION TEST** | AI resolution is strictly forbidden (`normalizedRole === 'AI' => 403 Forbidden`). Dual-channel notification records are created. Needs automated NestJS integration tests verifying HTTP 403 when an AI identity calls resolution. |

---

## 3. Deep Architectural & Codebase Findings

### 3.1 Consent Lifecycle & Volatile State
- **File:** [`backend/src/consent/consent.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/consent/consent.service.ts#L20)
- **Defect:** `private readonly otpChallenges: Map<string, OtpChallengeRecord> = new Map();`
- **Impact:** Any container restart, multi-instance horizontal scaling, or server crash wipes all active verification challenges, preventing parents from completing verification.
- **Required Action:** Store challenges in Redis or a dedicated `ConsentChallenge` Prisma model with short TTLs and attempt counters.

### 3.2 Incomplete Data Purge (Statutory DPDP Violation)
- **File:** [`backend/src/consent/consent.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/consent/consent.service.ts#L200-L236)
- **Defect:** `executePurge` updates only `User` table (`name = '[PURGED_ANONYMIZED_DPDP_COMPLIANT]'`, `email = anonymizedEmail`).
- **Impact:** Student practice sessions, responses, cognitive telemetry, and topic mastery remain permanently in the database under `studentId`, violating DPDP statutory erasure obligations.
- **Required Action:** Implement a comprehensive cascade purge that either cryptographically zeroizes or pseudorandomizes student identifiers across `UserAnswer`, `PracticeSession`, `UserTopicMastery`, and telemetry tables, while retaining legally mandated audit records.

### 3.3 Audit Ledger Lacks Adversarial Tests & Canonical JSON
- **File:** [`backend/src/audit/audit.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/audit/audit.service.ts#L48-L53)
- **Defect:** `const metaStr = payload.userMetadata && typeof payload.userMetadata === 'object' ? JSON.stringify(payload.userMetadata) : '';`
- **Impact:** Standard `JSON.stringify` does not guarantee deterministic key order. An entry re-serialized with differing key order will produce an HMAC mismatch, falsely failing chain verification.
- **Defect:** [`backend/src/audit/audit.spec.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/audit/audit.spec.ts) contains 0 tests for `verifyLedgerIntegrity` or tampering detection.
- **Required Action:** Implement deterministic canonical JSON serialization (RFC 8785) and an adversarial attack test suite verifying detection of altered payloads, forged previous hashes, and deleted events.

### 3.4 Failing Tenant Unit Test
- **File:** [`backend/src/tenants/tenants.spec.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/tenants/tenants.spec.ts#L40)
- **Defect:** Test mocks `aggregate` with `_avg: { mastery: 0.76 }`, while service queries `_avg: { masteryProbability: true }`.
- **Result:** Jest exits with code 1 (`Expected: 0.76, Received: 0`).
- **Required Action:** Correct test mock and verify tenant KPI aggregation passes cleanly.

### 3.5 AI Resolution Invariant Check
- **File:** [`backend/src/safety/safety-escalation.service.ts`](file:///C:/Users/ASUS/Documents/Youva-EdAi/YOUVA-EdAi/backend/src/safety/safety-escalation.service.ts#L114-L118)
- **Positive Invariant:**
  ```typescript
  if (normalizedRole === 'AI' || normalizedRole === 'BOT' || normalizedRole === 'SYSTEM') {
    throw new ForbiddenException(
      'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
    );
  }
  ```
- **Finding:** The invariant is correctly coded in the service layer, but requires an automated HTTP integration test demonstrating that `POST /api/v1/safety/incidents/:id/resolve` returns `403 FORBIDDEN` when called with an AI role or identity.

---

## 4. Phase 2 Implementation Roadmap (Cycles 2–9)

| Cycle | Focus | Key Deliverables |
|---|---|---|
| **Cycle 2** | **Consent Lifecycle & Data Purge** | Persistent OTP challenge store, complete 9-stage state machine (`NO_CONSENT` $\to$ `DELETED`), and multi-table cascading data purge. |
| **Cycle 3 & 4** | **Safety Escalation & Dual Routing** | Safety policies documentation (`docs/product/phase-2/safety/`), dual-channel routing matrix, and automated tests verifying AI 403 on resolution. |
| **Cycle 5** | **Tamper-Evident Audit System** | RFC 8785 canonical JSON hashing, forward hash chain verification, and adversarial test suite (7 attack vectors). |
| **Cycle 6** | **Authorization Attack Testing** | Automated adversarial suite for `TEST-SEC-001` through `TEST-SEC-005` (student isolation, teacher cross-access, privilege escalation). |
| **Cycle 7** | **Teacher Safety UI** | Clean, uncluttered Safety Alert Card avoiding AI essays and speculative diagnoses. |
| **Cycle 8** | **Independent Review Package** | Review documentation and `findings-register.md` in `docs/product/phase-2/review/`. |
| **Cycle 9** | **Manual Verification & Exit Gate** | End-to-end walkthrough scripts for consent lifecycle and multi-scenario safety escalations. |
