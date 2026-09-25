# YOUVA EdAI — Phase 7: Operational Support Model
## Tiered Institutional Support, Escalation Pathways, and Service Level Objectives (SLOs)

---

## 1. Multi-Tier Support Topology

To ensure rapid response for partner schools, YOUVA operates a 3-tier operational support model:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      OPERATIONAL SUPPORT TOPOLOGY                      │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Tier                │ Responsible Team │ Primary Responsibilities      │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ Tier 1: Frontline   │ School IT Liaison│ Password resets, hardware/PWA │
│                     │ & Helpdesk       │ connectivity, parent login    │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ Tier 2: Application │ YOUVA Operations │ Roster sync errors, seat      │
│                     │ & EdTech Support │ allocations, curriculum flags │
├─────────────────────┼──────────────────┼───────────────────────────────┤
│ Tier 3: Engineering │ On-Call Platform │ Database deadlocks, SSRF      │
│                     │ & Security Team  │ alerts, P1 safety escalations │
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

---

## 2. Priority Levels & Contractual SLA Response Times

| Severity | Incident Definition | Response Target | Resolution Target | Customer Update Cadence |
|---|---|---|---|---|
| **P1 — Critical** | Platform down; school computer lab completely blocked; cross-tenant safety leak | **$< 15\text{ mins}$** | **$< 2\text{ hours}$** | Every 30 minutes |
| **P2 — Major** | Key feature blocked (e.g. Teacher Cockpit down, but students can practice) | **$< 1\text{ hour}$** | **$< 6\text{ hours}$** | Every 2 hours |
| **P3 — Moderate** | Single student account issue, minor visual glitch, export delay | **$< 4\text{ hours}$** | **$< 24\text{ hours}$** | Daily |
| **P4 — Minor** | Feature request, documentation clarification | **$< 24\text{ hours}$** | Next Sprint | Weekly |
