# YOUVA EdAI — Phase 7: Operational Alerting Specification
## Alert Routing Rules, On-Call Paging Tiers, and Noise Suppression Guidelines

---

## 1. Alert Tiers & Notification Channels

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALERT NOTIFICATION MATRIX                       │
├─────────┬──────────────────────────┬───────────────────┬───────────────┤
│ Tier    │ Condition Triggered      │ Channel / Tool    │ Target Team   │
├─────────┼──────────────────────────┼───────────────────┼───────────────┤
│ Tier 1: │ Database outage, RLS leak│ PagerDuty Phone   │ Primary +     │
│ CRITICAL│ SSRF attempt, Safety SLA │ Call + High-Pri SMS│ Secondary On-Call│
├─────────┼──────────────────────────┼───────────────────┼───────────────┤
│ Tier 2: │ P95 latency > 500ms,     │ Slack #alerts-p2  │ On-Call       │
│ WARNING │ Seat quota >= 90%, 5xx>1%│ + Opsgenie Push   │ Engineer      │
├─────────┼──────────────────────────┼───────────────────┼───────────────┤
│ Tier 3: │ Backup snapshot verified,│ Slack #ops-feed   │ Platform Team │
│ INFO    │ Roster sync completed    │ (No waking alert) │ (Business Hrs)│
└─────────┴──────────────────────────┴───────────────────┴───────────────┘
```

---

## 2. Core Prometheus Alert Definitions

```yaml
# Prometheus Alerting Rules Excerpt
groups:
  - name: youva_phase7_critical_alerts
    rules:
      - alert: TenantSecurityBoundaryViolation
        expr: increase(youva_security_cross_tenant_violations_total[1m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "CRITICAL: Cross-tenant data access attempt detected"
          runbook: "docs/product/phase-7/operations/incident-response.md"

      - alert: ChildSafetyReviewQueueBreach
        expr: youva_safety_open_incidents{status="ESCALATED"} > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CRITICAL: Child safety incident unacknowledged past SLA"

      - alert: InstitutionalSeatQuotaNearingLimit
        expr: (youva_tenant_allocated_seats / youva_tenant_contracted_seats) > 0.90
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "WARNING: Tenant approaching 90% seat license capacity"
```

---

## 3. Noise Suppression & Alert Hygiene

- **De-duplication**: Alertmanager groups alerts by `tenantId` and `alertname` with a 5-minute wait window, preventing alert storms during transient network flickers.
- **Inhibition**: If `DatabaseDown` fires, downstream alerts (e.g. `APIResponseSlow`, `SessionSyncFailed`) are automatically inhibited to focus on root cause.
