# YOUVA-EdAI — Requirements Traceability Matrix (RTM)

## 1. Traceability Architecture

The Requirements Traceability Matrix maps every core architectural requirement from N1 through N7 to its technical design, concrete implementation, automated test suite, independent black-box verification test, evidentiary artifact, and N8 acceptance status.

```
Requirement ──► Technical Design ──► Implementation ──► Automated Test ──► Independent Verification ──► Evidence ──► N8 Status
```

---

## 2. Traceability Matrix Table

| Req ID | Requirement Description | Technical Design | Code Implementation | Automated Test Suite | Independent Verification | Evidentiary Artifact | N8 Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Multi-Factor & Secure Password Authentication | NestJS Auth Module + bcrypt + JWT | `auth.service.ts`, `jwt.strategy.ts` | `03-auth-tenant-isolation.e2e-spec.ts` | `AUTH-V01..AUTH-V15` | Auth response tokens & audit logs | **INDEPENDENTLY VERIFIED** |
| **REQ-AUTH-02** | Token Expiration, Tamper Rejection & Blacklisting | Passport JWT + Signature Verification | `jwt-auth.guard.ts`, `auth.controller.ts` | `security-hardening.e2e-spec.ts` | `AUTH-V04..AUTH-V08` | Tampered token 401 response | **INDEPENDENTLY VERIFIED** |
| **REQ-TENANT-01** | Strict Multi-Tenant Schema & Query Isolation | Tenant Interceptor + Prisma Middleware | `tenant.interceptor.ts`, `prisma.service.ts` | `03-auth-tenant-isolation.e2e-spec.ts` | `AUTHZ-V01..AUTHZ-V10` | Cross-tenant query 403 / 0 results | **INDEPENDENTLY VERIFIED** |
| **REQ-TENANT-02** | Prevention of IDOR / BOLA Cross-Tenant Escapes | Tenant ownership validation guards | `roles.guard.ts`, `student.service.ts` | `security-hardening.e2e-spec.ts` | `AUTHZ-V11..AUTHZ-V25` | Resource substitution 403 response | **INDEPENDENTLY VERIFIED** |
| **REQ-DPDP-01** | Mandatory Verifiable Parental Consent Gate | DPDP Consent Service + Prisma model | `consent.service.ts`, `consent.guard.ts` | `06-parent-safety-closed-loop.e2e-spec.ts` | `CONSENT-V01..CONSENT-V07` | DPDPNonCompliance 403 response | **INDEPENDENTLY VERIFIED** |
| **REQ-DPDP-02** | Consent Revocation & Immediate Processing Restrict | Consent audit & status transition | `parent-consent.service.ts` | `human-governed-operations.e2e-spec.ts` | `CONSENT-V08..CONSENT-V12` | Session rejection upon revocation | **INDEPENDENTLY VERIFIED** |
| **REQ-LEARN-01** | Canonical Closed Learning Loop Execution | Learning Loop Service + Prisma | `learning-loop.service.ts` | `learning-loop.e2e-spec.ts` | `LEARN-V01..LEARN-V15` | End-to-end attempt $\rightarrow$ mastery | **INDEPENDENTLY VERIFIED** |
| **REQ-LEARN-02** | BKT Mastery Calculation & Deterministic Progression | BKT Algorithm Service ($p=0.1$ to $0.99$) | `bkt.service.ts` | `04-student-learning-journey.e2e-spec.ts` | `LEARN-V16..LEARN-V25` | DB mastery delta audit logs | **INDEPENDENTLY VERIFIED** |
| **REQ-MAST-01** | Atomic Transactional Persistence & Rollback | Prisma `$transaction` Interactive Tx | `learning-persistence.service.ts` | `chaos-resilience.e2e-spec.ts` | `MASTERY-V01..MASTERY-V10` | Rollback test without mastery shift | **INDEPENDENTLY VERIFIED** |
| **REQ-MAST-02** | Duplicate Client Attempt Deduplication | Idempotency Service + Set Cache | `idempotency.service.ts` | `chaos-resilience.e2e-spec.ts` | `MASTERY-V11..MASTERY-V20` | Concurrent burst single mutation | **INDEPENDENTLY VERIFIED** |
| **REQ-ADAPT-01** | 5-Tier Mastery Activity Adaptation | Adaptive Recommendation Engine | `recommendation.service.ts` | `learning-loop.e2e-spec.ts` | `MASTERY-V15..MASTERY-V20` | Tiered exercise assignment outputs | **INDEPENDENTLY VERIFIED** |
| **REQ-TEACH-01** | Teacher Roster Analytics & Visibility | Teacher Ops Controller + Service | `teacher-intervention-ops.service.ts` | `05-teacher-student-closed-loop.e2e-spec.ts` | `TEACH-V01..TEACH-V07` | Class roster mastery aggregation | **INDEPENDENTLY VERIFIED** |
| **REQ-TEACH-02** | Human Teacher Consequential Authorization | Teacher Authorization Tx Service | `teacher-ops.service.ts` | `human-governed-operations.e2e-spec.ts` | `TEACH-V08..TEACH-V15` | AI recommendation pending review | **INDEPENDENTLY VERIFIED** |
| **REQ-PAR-01** | Parent-Child Authoritative Visibility Boundary | Parent Ops Service + Child Guard | `parent.service.ts` | `06-parent-safety-closed-loop.e2e-spec.ts` | `PARENT-V01..PARENT-V06` | Linked child progress JSON payload | **INDEPENDENTLY VERIFIED** |
| **REQ-PAR-02** | Block Parent Access to Unlinked Learners | Boundary Validator | `parent-boundary.guard.ts` | `security-hardening.e2e-spec.ts` | `PARENT-V07..PARENT-V12` | Unlinked student access 403 Forbidden | **INDEPENDENTLY VERIFIED** |
| **REQ-SAFE-01** | 7-Category Acute Child Safety Detection | Safety Engine + Regex/Keyword Scanner | `safety.service.ts`, `safety-moderator.ts` | `safety-incident-rehearsal.e2e-spec.ts` | `SAFETY-V01..SAFETY-V14` | Acute event classified & escalated | **INDEPENDENTLY VERIFIED** |
| **REQ-SAFE-02** | Strict Prohibition of AI Closing Safety Cases | Safety Invariant Assertion Guard | `safety-moderator.service.ts` | `ai-production-boundary.e2e-spec.ts` | `SAFETY-V15..SAFETY-V25` | AI resolution attempt blocked (403) | **INDEPENDENTLY VERIFIED** |
| **REQ-SAFE-03** | Safety Case Human Reviewer Resolution | Safety Escalation Controller | `safety-ops.controller.ts` | `human-governed-operations.e2e-spec.ts` | `SAFETY-V20..SAFETY-V25` | Authorized human resolution log | **INDEPENDENTLY VERIFIED** |
| **REQ-AI-01** | AI Gateway Model Router & Provider Abstraction | AiGatewayService + Multi-provider | `ai-gateway.service.ts`, `model-router.ts`| `ai-production-boundary.e2e-spec.ts` | `AI-V01..AI-V10` | Gemini / Ollama invocation traces | **INDEPENDENTLY VERIFIED** |
| **REQ-AI-02** | AI Prompt Injection & Adversarial Defense | AiSafetyModeratorService | `ai-safety-moderator.service.ts` | `ai-adversarial.e2e-spec.ts` | `AI-V11..AI-V18` | Injection payload rejected with 403 | **INDEPENDENTLY VERIFIED** |
| **REQ-AI-03** | AI Data Boundary & Cross-Tenant Minimization | Input Minimizer & PII Redactor | `ai-gateway.service.ts` | `security-hardening.e2e-spec.ts` | `AI-V19..AI-V25` | PII stripped prompt log evidence | **INDEPENDENTLY VERIFIED** |
| **REQ-FIN-01** | AI FinOps Multi-Tenant Daily Spend Controls | AiCostTrackerService | `ai-cost-tracker.service.ts` | `aiops-security-observability.e2e-spec.ts`| `AI-V10, CHAOS-012` | 80% soft warning & 100% hard block | **INDEPENDENTLY VERIFIED** |
| **REQ-SEC-01** | Network SSRF Defense & Cloud Metadata Shield | SsrfGuardService | `ssrf-guard.service.ts` | `security-hardening.e2e-spec.ts` | `SEC-V01..SEC-V10` | Private IP & metadata blocked (400) | **INDEPENDENTLY VERIFIED** |
| **REQ-SEC-02** | Cryptographic HMAC Audit Hash Chaining | AuditTamperService | `audit-tamper.service.ts` | `security-hardening.e2e-spec.ts` | `SEC-V11..SEC-V20` | Valid hash chain verification report | **INDEPENDENTLY VERIFIED** |
| **REQ-SEC-03** | Production Exception Masking & Sanitize | ProductionExceptionFilter | `production-exception.filter.ts` | `security-hardening.e2e-spec.ts` | `SEC-V21..SEC-V30` | Masked generic 500 error payload | **INDEPENDENTLY VERIFIED** |
| **REQ-REL-01** | Circuit Breakers with Deterministic Fallbacks | CircuitBreakerService | `circuit-breaker.service.ts` | `observability-reliability.e2e-spec.ts` | `REL-V01..REL-V10` | Open circuit fallback execution | **INDEPENDENTLY VERIFIED** |
| **REQ-REL-02** | Bounded Jitter Exponential Retries | RetryPolicyService | `retry-policy.service.ts` | `chaos-resilience.e2e-spec.ts` | `REL-V11..REL-V18` | Jittered backoff logs on transient err | **INDEPENDENTLY VERIFIED** |
| **REQ-REL-03** | Transactional Outbox with Poison Isolation | OutboxWorkerService | `outbox-worker.service.ts` | `aiops-security-observability.e2e-spec.ts`| `REL-V19..REL-V25` | Dead-letter queue isolation & replay | **INDEPENDENTLY VERIFIED** |
| **REQ-DR-01** | Automated 12-Point DR Backup Verification | DrVerificationService | `dr-verification.service.ts` | `disaster-recovery-incident.e2e-spec.ts` | `REL-V20..REL-V25` | 12-point drill report (DR-001..012) | **INDEPENDENTLY VERIFIED** |
| **REQ-UI-01** | Frontend Operational Connectivity & Degradation | ConnectivityBanner component | `ConnectivityBanner.tsx` | `frontend-resilience.e2e-spec.ts` | `BROWSER-V01..V10` | Offline/reconnecting state banner | **INDEPENDENTLY VERIFIED** |
| **REQ-UI-02** | Consequential Double-Submit Idempotency Guard | ConsequentialButton component | `ConsequentialButton.tsx` | `frontend-resilience.e2e-spec.ts` | `BROWSER-V11..V20` | Disabled button + UUID key generation | **INDEPENDENTLY VERIFIED** |
| **REQ-A11Y-01** | WCAG 2.1 AA Keyboard & Screen Reader Accessibility| Accessible semantic markup & ARIA | `login/page.tsx`, `ConnectivityBanner.tsx` | `frontend-resilience.e2e-spec.ts` | `A11Y-V01..A11Y-V15` | Tab order, ARIA-live alerts, labels | **INDEPENDENTLY VERIFIED** |
| **REQ-EDU-01** | CBSE Grade 8 Math Curriculum Item Alignment | NCERT Question Bank (60 items) | `seed.ts`, `question-bank.json` | `pilot-cohort-orchestration.e2e-spec.ts` | `EDU-V01..EDU-V20` | Question bank verified items | **INDEPENDENTLY VERIFIED** |
| **REQ-INST-01** | Telemetry Data Minimization & Event Auditing | StructuredLoggerService + Event Bus | `logger.service.ts`, `metrics.service.ts` | `observability-reliability.e2e-spec.ts` | `INST-V01..INST-V15` | Redacted PII structured log events | **INDEPENDENTLY VERIFIED** |
