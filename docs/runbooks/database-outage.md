# Runbook: PostgreSQL Database Outage & Failover Recovery

## 1. Trigger Conditions
- HTTP 500 error spikes on authoritative state reads or writes (`learningEvidenceLog`, `userTopicMastery`).
- `/health/ready` or `/health/live` returns status `down` with `database: down`.
- Connection pool saturation alerts: active pool clients = 100% of max allowed.
- Query timeouts exceeding 5000ms.

## 2. Severity Classification
- **SEV-0**: Total primary database unavailability affecting all tenants. Authoritative learning transactions blocked.
- **SEV-1**: Connection pool exhaustion or replica lag exceeding 10 minutes. Read-only degradation.

## 3. Immediate Triage & Diagnostics
1. **Verify Health Endpoint**:
   ```bash
   curl -i http://localhost:4000/health/dependencies
   ```
2. **Inspect Container & Pod Status**:
   ```bash
   docker ps | grep postgres
   docker logs --tail 200 youva-postgres
   ```
3. **Check Connection Count & Long Running Queries**:
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND (now() - pg_stat_activity.query_start) > interval '5 seconds';
   ```

## 4. Remediation Procedures
### A. Connection Pool Saturation
1. Terminate orphaned backend connections:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle in transaction' AND (now() - state_change) > interval '30 seconds';
   ```
2. Restart backend connection pooler (e.g., PgBouncer / Prisma client recycle).

### B. Primary Node Failover
1. If primary hardware or storage is unresponsive, promote the designated streaming standby replica:
   ```bash
   pg_ctl promote -D /var/lib/postgresql/data
   ```
2. Update application `DATABASE_URL` connection string to the promoted primary endpoint or DNS CNAME.
3. Perform application rolling restart to clear stale pooled socket descriptors.

### C. Post-Failover Integrity Verification
1. Run database connectivity probe:
   ```bash
   curl -X GET http://localhost:4000/api/synthetic/probe/SYN-002
   ```
2. Verify mastery state read/write:
   ```bash
   curl -X GET http://localhost:4000/api/synthetic/probe/SYN-006
   ```
3. Verify zero data corruption in outbox queue:
   ```bash
   curl -X GET http://localhost:4000/api/synthetic/probe/SYN-004
   ```

## 5. Escalation & Postmortem
- If RTO > 15 minutes or RPO > 1 hour, initiate Disaster Recovery drill according to `disaster-recovery-restore.md`.
- File incident postmortem within 24 hours documenting root cause, query profile, and pool sizing adjustments.
