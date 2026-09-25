# YOUVA EdAI — Phase 7: Scale Architecture & Tenant Isolation
## Enterprise Infrastructure, Secure Query Pipelines, and Non-Obvious Isolation Boundaries

---

## 1. High-Level Multi-Tenant Architecture

Phase 7 hardens the platform to support multiple independent institutional school tenants on a shared, cost-effective infrastructure while guaranteeing strict cryptographic and logical isolation.

```
                          Incoming HTTP / WebSocket Request
                                         │
                                         ▼
                             [1. Authentication Guard]
                                         │ (Extracts JWT & Verified Identity)
                                         ▼
                             [2. Tenant Resolution Guard]
                                         │ (Resolves Tenant Context via Subdomain / Header)
                                         ▼
                             [3. Tenant Authorization Check]
                                         │ (Verifies Principal is active member of Tenant)
                                         ▼
                             [4. Scoped Execution Context]
                                         │ (Binds AsyncLocalStorage TenantContext)
                                         ▼
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
 [Database Repositories]         [Redis Cache Layer]            [Async Job Queues]
 (Auto-injected `tenantId`      (Prefix: `tenant:{id}:*`)       (Enforced `tenantId` payload
  via Prisma / SQL Middleware)   Zero cross-tenant keys          isolation in background workers)
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         ▼
                                [PostgreSQL Storage]
                               (Row-Level Security RLS)
```

---

## 2. The Hardened Query Pipeline: "Difficult to Omit Accidentally"

In traditional architectures, developers must remember to add `where: { tenantId }` to every query. If a developer forgets on a single route, an Insecure Direct Object Reference (IDOR) data leak occurs.

In YOUVA EdAI Phase 7:
1. **AsyncLocalStorage Context**: Every request initializes an immutable `TenantContext` containing `tenantId`, `userId`, and `role`.
2. **Prisma Query Middleware**: Every Prisma query (`findUnique`, `findMany`, `update`, `delete`, `count`, `aggregate`) automatically intercepts the query AST and appends `where.tenantId = context.tenantId`.
3. **Fail-Closed Violation**: If an application query attempts to execute without an active `TenantContext`, the database client aborts immediately with `CrossTenantViolationError`.

---

## 3. The 8 Non-Obvious Isolation Boundaries

True tenant isolation extends far beyond SQL `WHERE` clauses. Phase 7 explicitly secures eight secondary boundaries where cross-talk commonly occurs:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 8 NON-OBVIOUS TENANT BOUNDARIES                  │
├───────────────────┬────────────────────────────────────────────────────┤
│ Boundary          │ Hard Isolation Mechanism                           │
├───────────────────┼────────────────────────────────────────────────────┤
│ 1. Cache Keys     │ Redis keys strictly namespaced:                    │
│                   │ `tenant:{tenant_id}:{subsystem}:{key}`             │
├───────────────────┼────────────────────────────────────────────────────┤
│ 2. Queue Messages │ BullMQ job payloads require validated `tenantId`.  │
│                   │ Workers discard jobs with mismatched context.      │
├───────────────────┼────────────────────────────────────────────────────┤
│ 3. Object Storage │ S3 bucket prefixes: `s3://youva-data/{tenant_id}/` │
│                   │ IAM policy restricts presigned URLs to tenant path.│
├───────────────────┼────────────────────────────────────────────────────┤
│ 4. Audit Chains   │ HMAC-SHA256 audit ledgers maintained per-tenant.   │
│                   │ Tenant A cannot verify or view Tenant B hash links.│
├───────────────────┼────────────────────────────────────────────────────┤
│ 5. Analytics      │ Aggregations, OLAP cubes, and BKT velocity curves  │
│                   │ partition on `tenant_id` at the database level.    │
├───────────────────┼────────────────────────────────────────────────────┤
│ 6. App Logging    │ Structured Winston logger scrubs student PII and   │
│                   │ tags all log lines with `tenantId` for SIEM silo.  │
├───────────────────┼────────────────────────────────────────────────────┤
│ 7. Notifications  │ WebSockets, SMS, and email queues filter recipients│
│                   │ by active tenant roster membership.                │
├───────────────────┼────────────────────────────────────────────────────┤
│ 8. Webhooks       │ Webhook dispatch and ingestion routes sign and     │
│                   │ verify payloads using tenant-specific secret keys. │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 4. Disaster Recovery & Availability Architecture

- **Active-Passive Multi-AZ Deployment**: Primary database in AWS Mumbai AZ-1; synchronous standby in AZ-2.
- **Automated Point-in-Time Recovery (PITR)**: Continuous WAL archiving to S3, enabling restoration to any millisecond within the last 35 days.
- **RPO Target**: $< 15\text{ minutes}$ (guaranteed data loss window in disaster).
- **RTO Target**: $< 60\text{ minutes}$ (full service recovery time from scratch).
