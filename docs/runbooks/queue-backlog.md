# Runbook: Outbox Event Backlog & Poison Message Recovery

## 1. Trigger Conditions
- `SYN-004` (Outbox Queue Backlog Probe) returns `FAIL` (pending count $\ge$ 1,000).
- Lag between event creation and processing exceeds 300 seconds.
- Spike in `DEAD_LETTER` events.

## 2. Severity Classification
- **SEV-2**: Pending queue backlog > 1,000 events. Processing lag > 5 minutes.
- **SEV-1**: Pending queue backlog > 10,000 events or DLQ growth > 100 events/minute.

## 3. Immediate Diagnostics
1. **Query Outbox Status Distribution**:
   ```sql
   SELECT status, count(*), min(created_at), max(attempts)
   FROM "OutboxEvent"
   GROUP BY status;
   ```
2. **Inspect Poison Messages in DLQ**:
   ```sql
   SELECT id, event_type, last_error, attempts, payload
   FROM "OutboxEvent"
   WHERE status = 'DEAD_LETTER'
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

## 4. Remediation Steps
1. **Scale Outbox Workers**:
   - Increase batch polling size or frequency via configuration if worker is healthy but throughput constrained:
     ```env
     OUTBOX_BATCH_SIZE=200
     OUTBOX_POLL_INTERVAL_MS=500
     ```
2. **Handle Poison / Malformed Messages**:
   - Identify schema or handler bug causing repeated failures.
   - If message payload is fundamentally invalid, quarantine the record:
     ```sql
     UPDATE "OutboxEvent" SET status = 'DEAD_LETTER_QUARANTINED' WHERE id = '<poison_id>';
     ```
3. **Replay Recovered Events**:
   - Once the downstream consumer bug is fixed, replay dead letter events:
     ```bash
     curl -X POST http://localhost:4000/api/events/outbox/replay/<event_id>
     ```
4. **Verification**:
   - Run probe:
     ```bash
     curl -X GET http://localhost:4000/api/synthetic/probe/SYN-004
     ```
