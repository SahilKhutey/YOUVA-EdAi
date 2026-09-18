# YOUVA-EdAI — Cycle N14 Architecture & Governance Charter
## Scale Infrastructure, Multi-Tenant Hardening & Commercial Production Readiness

---

### 1. The Governing Principles of Cycle N14
1. **Demand-Gated Scalability**:
   $$\text{No infrastructure without demonstrated demand.}$$
   Expansion follows validated customer workload ($D_0 \rightarrow D_5$) rather than speculative over-provisioning.
2. **The Foundational AI Invariant**:
   $$\text{AI recommends; humans authorize consequential decisions.}$$
3. **The Multi-Tenant Isolation Invariant**:
   $$\text{Authentication} \longrightarrow \text{Authorization} \longrightarrow \text{Tenant Scope} \longrightarrow \text{Resource Ownership} \longrightarrow \text{Validation} \longrightarrow \text{Transaction} \longrightarrow \text{Audit}$$

---

### 2. Demand Gating Framework ($D_0 - D_5$)
- **$D_0$ (No Demand)**: Baseline container footprints; serverless/shared execution.
- **$D_1$ (Early Pilot)**: $\le 50$ concurrent learners, shared database with strict `tenant_id` row-level partitioning.
- **$D_2$ (Repeat Paid Usage)**: $\le 250$ concurrent learners, tiered Redis caching, automated daily snapshot backups.
- **$D_3$ (Institutional Demand)**: $\le 1,000$ concurrent learners, dedicated connection pools, transactional outbox workers.
- **$D_4$ (Multi-Institution Demand)**: $\le 5,000$ concurrent learners, read-replicas, rate-limiting tiers, AI FinOps spend caps.
- **$D_5$ (Large-Scale Validated Demand)**: $> 5,000$ concurrent learners, tenant-specific schema or database options justified by SLA contracts.

---

### 3. Server-Derived Tenant Context
Client-provided tenant headers (`x-tenant-id`) are treated as untrusted hints. Authorization resolves authoritative tenant membership strictly from validated cryptographic session tokens:
```typescript
interface TenantContext {
  tenantId: string;
  actorId: string;
  role: string;
  permissions: string[];
  correlationId: string;
}
```

---

### 4. Platform vs. Tenant Policy Hierarchy (Clause N14.13)
The governing hierarchy strictly forbids lower-level settings from weakening platform-level protections:
$$\text{Platform Safety Policy} \longrightarrow \text{Jurisdiction Policy} \longrightarrow \text{Tenant Policy} \longrightarrow \text{Role Policy} \longrightarrow \text{Learner Policy}$$

- **Non-Negotiable Restrictions**:
  - Tenant administrators **cannot** disable child safety moderation.
  - Tenant administrators **cannot** bypass statutory parental consent.
  - Tenant administrators **cannot** enable autonomous purchasing for minors.
  - Tenant administrators **cannot** permit AI to unilaterally mutate mastery truth.

---

### 5. AI Provider Economics & FinOps Budgeting
- **Hierarchical Spending Caps**:
  $$\text{Platform Global Budget} \longrightarrow \text{Tenant Monthly Budget} \longrightarrow \text{Plan Quota} \longrightarrow \text{Learner Quota} \longrightarrow \text{Request Limit}$$
- **Graceful Degradation Pipeline**:
  When premium AI budgets are exhausted or LLM providers fail:
  $$\text{AI Unavailable} \longrightarrow \text{Approved Content} \longrightarrow \text{Deterministic Activity} \longrightarrow \text{Cached Response} \longrightarrow \text{Teacher Workflow}$$

---

### 6. Storage Separation & Redis Role Confinement
- **PostgreSQL**: Authoritative learning truth (BKT mastery, assessments, DPDP consent, safety incidents, cryptographic audit logs).
- **Redis**: Ephemeral roles only (cache, rate limiting, temporary sessions, queue dispatch). Redis is structurally prohibited from storing authoritative learning state.
