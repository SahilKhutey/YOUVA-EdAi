# YOUVA EdAI — Phase 7: Infrastructure Decision Records (IDRs)
## Architectural Decision Records for Multi-Tenancy, Commercial Decoupling, and Boundary Controls

---

## IDR-01: Multi-Tenancy Isolation Strategy (Shared DB + RLS vs. DB-per-Tenant)

- **Context**: B2B school scaling requires data isolation between independent institutional tenants.
- **Alternatives Considered**:
  1. *Database-per-Tenant*: Complete physical separation of PostgreSQL instances per school.
  2. *Shared Database with Row-Level Security (RLS)*: Single PostgreSQL database with mandatory `tenant_id` foreign keys and server-side context interceptors.
- **Decision**: **Shared Database with Row-Level Security (RLS)**.
- **Rationale**: At current validated scale (250–2,000 students), database-per-tenant introduces massive DevOps complexity, schema migration fragmentation, and high cloud overhead. RLS enforced via `TenantContext` and Prisma middleware delivers mathematical data isolation with zero operational sprawl.

---

## IDR-02: Commercial Entitlement Architecture (Decoupled vs. Stripe-Coupled)

- **Context**: System must support institutional B2B contracts without hard-coding consumer payment processors.
- **Decision**: **Decouple Product Entitlements from Payment Gateways**.
- **Rationale**: Institutional school contracts are negotiated via annual purchase orders, bank wires, and municipal educational tenders, not credit card swipes. By introducing `InstitutionalContract` and `TenantEntitlement`, product feature flags check enterprise contract state independently of whether Stripe, Razorpay, or manual invoicing is utilized.

---

## IDR-03: LMS/SIS Integration & SSRF Perimeter Defense

- **Context**: School IT departments require roster synchronization from on-premise SIS/LMS instances.
- **Decision**: **Strict Pull-Based Connector with Pre-Approved Hostname Allowlisting & SSRF Guard**.
- **Rationale**: Ingesting data from arbitrary external URLs introduces critical Server-Side Request Forgery (SSRF) vulnerabilities (e.g. attackers targeting AWS metadata `169.254.169.254` or internal microservices). The connector enforces:
  1. Strict allowlist matching against domains named in the customer contract (`canvas.dpsrkp.net`, etc.).
  2. IP resolution inspection blocking loopback (`127.0.0.1`), link-local (`169.254.0.0/16`), and private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  3. Response payload size limits ($\le 5\text{ MB}$) and $5.0\text{s}$ timeout caps.

---

## IDR-04: Non-Obvious Multi-Tenant Boundary Isolation (Cache & Queue Namespacing)

- **Context**: Applications that isolate database tables frequently leak data across tenants in Redis caches, job queues, or log streams.
- **Decision**: **Mandatory Prefix Namespacing for All Caches, Queues, and Object Storage**.
- **Rationale**: All Redis keys are strictly formatted as `tenant:{tenant_id}:{subsystem}:{key}`. All BullMQ / Celery worker payloads require an immutable `tenant_id` header, validated by workers before execution.

---

## IDR-05: Deferral of B2C Stripe Consumer Subscriptions

- **Context**: `commercial/` contained prototype Stripe recurring subscription logic.
- **Decision**: **Formally Defer B2C Billing to Phase 8/9**.
- **Rationale**: Zero consumer marketing has been initiated. Activating Stripe webhooks, credit card storage compliance (PCI-DSS), and dunning infrastructure without paying consumer users creates technical and regulatory liability without commercial return.
