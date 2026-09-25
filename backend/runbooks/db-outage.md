# Operational Runbook: Database Outage & Connection Exhaustion

## 1. Symptoms
- `/health/ready` returns `status: "not_ready"` with `database.status: "down"`.
- Application logs show `PrismaClientInitializationError`, `Timed out fetching a new connection from the pool`, or `FATAL: remaining connection slots are reserved`.
- All state mutations (evidence logging, publishing, adaptive decisions) fail with 500 errors.

## 2. Detection
- Prometheus Alert: `DatabaseDown` (`youva_database_latency` failing or latency > 2000ms).
- Prometheus Alert: `DbConnectionPoolSaturated` (Active connections > 90% of pool limit).

## 3. Immediate Action
1. **Verify PostgreSQL Service**:
   ```bash
   pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
   ```
2. **Check Connection Count**:
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
3. **Identify Blocking Queries**:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle' AND (now() - pg_stat_activity.query_start) > interval '10 seconds'
   ORDER BY duration DESC;
   ```

## 4. Diagnosis
1. **Long-Running Transactions or Locks**:
   - Check if an unindexed query (e.g. unbounded analytics scan) is locking rows.
2. **Connection Leak**:
   - Check if application replicas scaled up and exceeded PostgreSQL `max_connections`.
3. **Disk Space Exhaustion**:
   - Verify PostgreSQL storage volume has free space (`df -h`).

## 5. Recovery
1. **Terminate Runaway Queries**:
   ```sql
   SELECT pg_cancel_backend(pid); -- graceful
   SELECT pg_terminate_backend(pid); -- immediate kill
   ```
2. **Restart Connection Pooler (PgBouncer / RDS Proxy)** if applicable.
3. **Failover to Standby Replica** if primary hardware failure is confirmed.
4. **Restart Application Instances** if client-side pool is deadlocked.

## 6. Post-Incident
- Review slow query logs (`EXPLAIN ANALYZE`).
- Verify index coverage for recent queries.
- Validate data integrity:
  - Check latest `LearningEvidenceLog` records.
  - Verify outbox event queue state.
