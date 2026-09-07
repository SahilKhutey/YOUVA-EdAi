# YOUVA-EdAI Master API Specification

**Version 2.0 — RESTful Services & Integration Contracts**

---

## 1. Global API Standards

### 1.1. Base URLs & Versioning
* **Production Gateway**: `https://api.youva-edai.com/api/v1`
* **Local Development**: `http://localhost:3001/api/v1`

### 1.2. Required Headers
| Header | Description | Required On |
| :--- | :--- | :--- |
| `Authorization` | Bearer JWT (`Bearer <token>`) | All authenticated endpoints |
| `x-tenant-id` | Target Institutional Tenant UUID | All tenant-scoped & institutional routes |
| `Content-Type` | `application/json` | All `POST`, `PUT`, `PATCH` requests |
| `Idempotency-Key` | Unique request UUID for safe re-execution | State-mutating commercial, issuance, and sync routes |

### 1.3. Standard Error Envelope
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Integration access requires a teacher or administrator role.",
  "timestamp": "2026-09-07T12:00:00.000Z",
  "path": "/api/v1/interoperability/integrations"
}
```

---

## 2. Core Endpoints

### 2.1. Authentication & Tenant Membership
* `POST /auth/register` — Register student, parent, or educator.
* `POST /auth/login` — Authenticate and receive JWT with `userId`, `role`, and `tenantId`.
* `GET /auth/profile` — Fetch current user context and active permissions.

---

### 2.2. Learning & Diagnostic Assessment (P1–P4)
* `POST /learning/diagnostic/start` — Initialize adaptive diagnostic evaluation loop.
* `POST /learning/diagnostic/submit` — Submit assessment question responses; updates BKT mastery.
* `GET /learning/mastery/:subject` — Retrieve real-time Bayesian Knowledge Tracing topic mastery scores.
* `GET /learning/revision/schedule` — Retrieve spaced repetition revision schedule.
* `POST /practice/generate` — Generate dynamic practice questions based on current cognitive load.

---

### 2.3. Teacher Operations (P2, P13)
* `GET /teacher/classrooms` — List teacher-assigned classrooms within tenant.
* `GET /teacher/classrooms/:id/students` — Student 360 overview with cognitive metrics and risk scores.
* `POST /teacher/interventions` — Authorize or schedule an instructional intervention.
* `POST /teacher/mastery/override` — Authoritative teacher override of student topic mastery.

---

### 2.4. Safety & Parent Trust (P3)
* `GET /parent/children` — List linked student accounts.
* `POST /parent/consent` — Grant or revoke COPPA/FERPA educational AI consent.
* `GET /safety/incidents` — View open safety alerts for assigned students.
* `POST /safety/incidents/:id/resolve` — Authoritatively resolve a safety incident (Human Teacher/Admin only).

---

### 2.5. Autonomous Learning OS (Phase P14)
* `POST /autonomous-learning/actions/propose` — Propose next-best learning action via multi-objective engine.
* `POST /autonomous-learning/actions/:id/evaluate` — Evaluate policy compliance; checks hard safety gates.
* `POST /autonomous-learning/actions/:id/execute` — Execute sandboxed action within budget limits.
* `POST /autonomous-learning/approval/decide` — Human approval/rejection for gated autonomous proposals.
* `GET /autonomous-learning/provenance/:actionId` — Retrieve cryptographic SHA-256 decision provenance.

---

### 2.6. Trusted Credentials & Skills Passport (Phase P15)
* `GET /credentials/passport` — Retrieve authenticated learner's complete Skills Passport.
* `POST /credentials/evaluate-eligibility` — Evaluate student eligibility against credential criteria.
* `POST /credentials/request-issuance` — Submit credential candidate for teacher review.
* `POST /credentials/:id/verify` — Teacher/Institutional approval or rejection of credential.
* `POST /credentials/:id/share` — Generate secure, time-bounded public share token.
* `GET /api/v1/public/credentials/verify/:token` — **Public Verification Endpoint** (Unauthenticated, zero-PII data minimized verification).
* `POST /credentials/:id/revoke` — Authoritatively revoke issued credential and invalidate share tokens.

---

### 2.7. Institutional Interoperability (Phase P16)
* `POST /interoperability/tenants` — Create institutional tenant profile (Admin only).
* `POST /interoperability/tenants/:id/members` — Add tenant educator or administrator.
* `POST /interoperability/integrations` — Register new external LMS/SIS provider (`REST_JSON`, etc.).
* `GET /interoperability/integrations/:id/test` — Test external integration connectivity and health.
* `POST /interoperability/integrations/:id/import` — Ingest external records with cursor tracking and provenance.
* `POST /interoperability/integrations/:id/disable` — Deactivate external integration.
* `GET /interoperability/conflicts` — List data discrepancies between internal and external records.
* `PUT /interoperability/conflicts/:id` — Resolve conflict (`KEEP_INTERNAL`, `ACCEPT_EXTERNAL`, `MERGE`).
