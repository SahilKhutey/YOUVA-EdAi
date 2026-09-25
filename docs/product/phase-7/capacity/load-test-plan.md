# YOUVA EdAI — Phase 7: Capacity Load Test Plan
## Grounded Demand Sizing (1,000 Concurrent Learners), Traffic Profiles, and Bottleneck Identification

---

## 1. Capacity Sizing Principles: Actual Expected Demand

> [!IMPORTANT]
> **DO NOT BENCHMARK ARBITRARY "ONE MILLION USER" HYPOTHETICALS.**
> 
> Capacity planning in Phase 7 is sized against **empirically validated demand**:
> 
> $$\text{Demand Baseline} = \text{Current DPS Cohort (250)} + \text{Near-Term Expansion (500)} + \text{Growth Buffer (250)} = \mathbf{1,000\ Concurrent\ Active\ Learners}$$

---

## 2. Load Testing Traffic Profiles

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SIMULATED TRAFFIC SCENARIOS                     │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Scenario            │ Concurrency      │ Interaction Profile           │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 1. Normal Steady    │ 300 Learners     │ 1 question attempt every 15s; │
│    State            │ + 10 Teachers    │ steady BKT updates & telemetry│
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 2. Morning Lab Peak │ 1,000 Learners   │ Simultaneous logins within    │
│    Spike (08:00 IST)│ + 35 Teachers    │ 180 seconds; diagnostic launch│
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 3. Intensive Lab    │ 1,000 Learners   │ High-velocity practice runs;  │
│    Practice         │ (Active Sessions)│ 1 tap/voice submission / 6s   │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 4. Batch Digest &   │ 1,000 Finished   │ Background BullMQ workers     │
│    Report Flush     │ Sessions         │ generating 1,000 parent digest│
│                     │                  │ records and updating DAGs     │
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

---

## 3. SLA Pass/Fail Criteria

- **P95 Latency**: $< 350\text{ ms}$ on adaptive question selection and BKT updates.
- **P99 Latency**: $< 800\text{ ms}$ across all authenticated endpoints.
- **Error Rate**: $< 0.05\%$ total HTTP 5xx errors.
- **Connection Pool**: PgBouncer utilization $< 80\%$ (max 64 of 80 connections).
- **CPU / Memory Headroom**: Node.js containers $< 70\%$ CPU; Redis memory $< 65\%$.
