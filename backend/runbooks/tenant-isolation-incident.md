# Operational Runbook: Tenant Isolation & Data Boundary Incident

## 1. Symptoms
- A user from Tenant A observes or accesses knowledge, learner state, or analytics data belonging to Tenant B.
- API returns HTTP 403 / Forbidden due to tenant boundary violation, or an unexpected cross-tenant entity ID is logged.
- Audit log flags `tenant_isolation_failures` counter increment.

## 2. Detection
- Prometheus Alert: `TenantIsolationViolation` (`youva_tenant_isolation_failures > 0`).
- Security log filter: `TENANT_MISMATCH` or `CROSS_TENANT_ACCESS_ATTEMPT`.

## 3. Immediate Action
1. **Quarantine Affected Endpoint / Route**:
   - If a specific endpoint lacks tenant scoping, immediately disable or restrict that endpoint via rate-limiter or API gateway rule.
2. **Revoke Compromised Session Tokens**:
   - Invalidate tokens associated with the suspected actor or session.
3. **Capture Audit Forensics**:
   - Query `AuditEvent` table for the full timeline:
     ```sql
     SELECT * FROM "AuditEvent"
     WHERE "createdAt" >= NOW() - INTERVAL '2 hours'
     ORDER BY "createdAt" DESC;
     ```

## 4. Diagnosis
1. **Query Inspection**:
   - Check if a Prisma query omitted `tenantId` in the `where` clause:
     - Example bug: `prisma.knowledgeObject.findUnique({ where: { id } })` instead of scoping by `tenantId`.
2. **Object-Level Authorization Bypass**:
   - Check whether the endpoint verified the user's role and tenant membership before serving resources.

## 5. Recovery
1. **Deploy Emergency Hotfix**:
   - Add explicit tenant isolation to the offending query/guard.
2. **Database Integrity Verification**:
   - Ensure no cross-tenant mutation occurred:
     ```sql
     SELECT * FROM "LearnerKnowledgeState"
     WHERE "tenantId" != (SELECT "tenantId" FROM "User" WHERE "id" = "LearnerKnowledgeState"."learnerId");
     ```
3. **Audit Log Report Generation**:
   - Produce a compliance incident report detailing what records were accessed and whether any PII was disclosed.

## 6. Post-Incident
- Conduct mandatory security review.
- Add automated unit and integration tests asserting 403 Forbidden on cross-tenant access attempts.
- Notify Data Protection Officer (DPO) if required by jurisdiction regulations.
