# YOUVA EdAI — Phase 7: Multi-Tenancy Threat Model
## STRIDE Analysis, Attack Surface Decomposition, and Adversarial Defense Boundaries

---

## 1. Threat Modeling Scope & Assets

The multi-tenant security architecture protects five high-value institutional assets:
1. **Student Personal Data & Performance**: Diagnoses, BKT probabilities, voice transcripts.
2. **Teacher Observations & Overrides**: Confidential educator notes and intervention plans.
3. **Institutional Credentials**: School signing keys and verifiable credential schemas.
4. **Tenant Configuration**: Roster mappings, LMS integration credentials.
5. **Shared Computational Infrastructure**: PostgreSQL connection pools, Redis memory, background queues.

---

## 2. STRIDE Threat Analysis Matrix

| STRIDE Category | Specific Threat Scenario | Inherent Risk | Architectural Countermeasure | Residual Risk |
|---|---|---|---|---|
| **Spoofing** | Attacker injects `X-Tenant-ID: tenant-dps-rkpuram` into request header to access DPS data. | **CRITICAL** | Request headers ignored for authorization; tenant ID resolved strictly from cryptographically signed JWT session token. | Negligible |
| **Tampering** | Tenant A attempts to update or overwrite student profile owned by Tenant B via `PUT /api/v1/students/:id`. | **CRITICAL** | Prisma RLS middleware automatically appends `AND tenant_id = current_tenant` to all UPDATE/DELETE queries. | Negligible |
| **Repudiation** | Tenant administrator deletes school roster without logging originating tenant context. | **HIGH** | Every mutation logged to immutable append-only ledger stamped with `tenant_id`, `user_id`, and HMAC-SHA256 signature. | Negligible |
| **Information Disclosure** | IDOR vulnerability allows sequential enumeration of student IDs (`/students/1`, `/students/2`). | **CRITICAL** | Non-sequential UUIDv4 / DID tokens used; queries scoped by RLS return `404 Not Found` for out-of-tenant IDs. | Negligible |
| **Denial of Service** | "Noisy Neighbor": School A triggers massive parallel analytics export, exhausting database connection pool. | **HIGH** | PgBouncer connection pooling with tenant concurrency limits (max 20 concurrent connections per tenant). | Low |
| **Elevation of Privilege** | School administrator attempts to assign themselves platform super-admin role. | **CRITICAL** | Role-Based Access Control (RBAC) enforces strict role hierarchy; tenant admins cannot grant global roles. | Negligible |
