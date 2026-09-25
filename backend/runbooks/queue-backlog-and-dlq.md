# Operational Runbook: Queue Backlog & Dead-Letter Queue (DLQ)

## 1. Symptoms
- `/health/ready` reports `queue.status: "degraded"` or `queue.pendingDepth > 1000`.
- Learning evidence processing lag increases: student completes practice but learner state or mastery does not update promptly.
- Outbox table contains events in `DEAD_LETTER` status.

## 2. Detection
- Prometheus Alert: `OutboxQueueBacklogHigh` (`pendingDepth > 1000` for > 5 minutes).
- Prometheus Alert: `OutboxDeadLetterSpike` (`deadLetterCount > 50`).

## 3. Immediate Action
1. **Check Outbox Worker Health**:
   - Verify if `OutboxWorkerService` is actively running and processing batches.
2. **Inspect Dead-Lettered Records**:
   ```sql
   SELECT id, "eventType", "aggregateType", "aggregateId", attempts, "lastError"
   FROM "OutboxEvent"
   WHERE status = 'DEAD_LETTER'
   ORDER BY "availableAt" DESC
   LIMIT 20;
   ```

## 4. Diagnosis
1. **Poison Pill Messages**:
   - Check `lastError` column for schema mismatch, malformed payload, or serialization errors.
2. **Downstream Bottlenecks**:
   - Check if the target consumer (e.g. mastery recalculation or external analytics) is failing or timing out.
3. **Worker Concurrency Limit**:
   - Check if worker batch size is too small for current ingestion rate.

## 5. Recovery
1. **Scale Workers**:
   - Increase outbox processing frequency or increase batch size:
     ```typescript
     await outboxWorker.processBatch(100);
     ```
2. **Fix & Replay Dead-Letter Events**:
   - Once underlying issue or bad consumer is fixed, reset dead-letter events for retry:
     ```sql
     UPDATE "OutboxEvent"
     SET status = 'PENDING', attempts = 0, "availableAt" = NOW()
     WHERE status = 'DEAD_LETTER' AND "eventType" = 'TARGET_EVENT_TYPE';
     ```
3. **Quarantine Unrecoverable Events**:
   - Archive unrecoverable events to dead-letter audit table before dismissing.

## 6. Post-Incident
- Verify consumer idempotency so replaying events does not double-count metrics.
- Ensure event schema versioning includes backward-compatible deserialization.
