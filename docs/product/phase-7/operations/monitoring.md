# YOUVA EdAI — Phase 7: Observability & Telemetry Specification
## Multi-Dimensional Metrics Architecture, Health Dashboards, and Ethical Telemetry Invariants

---

## 1. Ethical Telemetry Invariant

> [!IMPORTANT]
> **Avoid collecting additional child behavioral data simply because the observability system makes it technically possible.**
> 
> Production APM and telemetry tools (Prometheus, Datadog, Grafana) must strictly monitor system performance, latencies, error codes, and operational state.
> 
> Inspecting raw student answers, voice acoustics, or child browsing behavior in central telemetry pipelines is strictly prohibited under DPDP Act 2023 §9.

---

## 2. Multi-Dimensional Telemetry Categories

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY DIMENSIONS                        │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Dimension           │ Target Metric    │ Alert Threshold               │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 1. Product          │ Session Complete │ Completion rate < 85.0%       │
│                     │ API Latency      │ P95 latency > 350 ms          │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 2. Infrastructure   │ DB Connection Pool│ Utilization > 80% (64/80)    │
│                     │ BullMQ Queue Depth│ Queue age > 60 seconds        │
│                     │ HTTP 5xx Rate    │ 5xx errors > 0.05% of requests│
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 3. Security         │ Cross-Tenant Probes│ ANY cross-tenant 403 (P1)   │
│                     │ SSRF Guard Drops │ Outbound blocked count > 0    │
│                     │ Auth Failures    │ Spike > 50 failures / 5 mins  │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 4. Child Safety     │ Open Incidents   │ Unacknowledged > 10 mins      │
│                     │ Review Queue Age │ Item pending > 24 hours       │
│                     │ Notification Drop│ Delivery failure count > 0    │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ 5. Commercial       │ Seat Quota Headroom│ Seat allocation >= 90% (225)│
│                     │ Contract Expiry  │ Expiry window <= 30 days      │
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

---

## 3. Technology Stack & Dashboard Topology

- **Metrics Collection**: Prometheus client exporting `/metrics` endpoint (authenticated, internal VPC only).
- **Visualization**: Grafana dashboards:
  1. *Executive Operations Cockpit*: SLA availability, seat usage, error budget.
  2. *Tenant Security Dashboard*: Active tenant contexts, cross-tenant rejection counters.
  3. *Child Safety Sentinel*: Open review queue count, escalation alerts, timeout health.
- **Log Aggregation**: Structured JSON logs shipped to OpenSearch with automated PII redaction filters.
