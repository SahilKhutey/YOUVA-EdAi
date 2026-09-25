# YOUVA EdAI — Phase 9: Institutional Customer Onboarding Playbook
## Turnkey Tenant Provisioning, Roster Integration, Teacher Enablement, and Pilot Cutover

---

## 1. Onboarding Objective & Phases

The onboarding playbook guarantees seamless, secure transition from contract execution to active classroom adoption within a standard **14-day deployment window**.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ DAY 1 - 3:      │ ──> │ DAY 4 - 7:      │ ──> │ DAY 8 - 11:     │ ──> │ DAY 12 - 14:    │
│ TENANT SETUP    │     │ ROSTER SYNC     │     │ TEACHER ACADEMY │     │ PILOT CUTOVER   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. Four Operational Onboarding Milestones

### Milestone 1: Tenant Provisioning & Jurisdiction Binding (Days 1–3)
- Automated deployment of tenant database namespace with row-level security isolation (`phase7/models/tenant_isolation.py`).
- Binding of tenant configuration to the approved regional compliance profile (`in-dpdp.json` or `us-coppa-ferpa.json`).
- Security scan verifying strict cross-tenant data isolation.

### Milestone 2: Identity & Roster Synchronization (Days 4–7)
- Automated ingestion of student and teacher rosters via standard OneRoster CSV or Clever / ClassLink OAuth2 APIs.
- Delivery of digital parental consent notices via SMS / Email with Aadhaar OTP or digital signature links.
- Activation of students only upon verifiable parental consent receipt.

### Milestone 3: Teacher Enablement & Pedagogical Academy (Days 8–11)
- Mandatory 3-hour certified professional development workshop for all enrolled classroom teachers.
- Hands-on training on the Teacher Dashboard: reviewing diagnostics, inspecting BKT mastery, and executing teacher overrides.
- Certification test on handling distress alerts and safeguarding escalations.

### Milestone 4: Classroom Pilot Cutover & Health Check (Days 12–14)
- Live classroom kickoff session supervised by YOUVA implementation specialists.
- Real-time monitoring of system latency, token consumption, and hint telemetry.
- Formal sign-off on Day 14 by School Principal and District Superintendent.
