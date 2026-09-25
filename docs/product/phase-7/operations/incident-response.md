# YOUVA EdAI — Phase 7: Incident Response Runbook
## Rapid Containment Protocols, Forensic Procedures, and Blameless Post-Mortem Standards

---

## 1. Incident Lifecycle Overview

```
[1. DETECT & TRIAGE] ──> [2. CONTAIN & MITIGATE] ──> [3. REMEDIATE & VERIFY]
       │                          │                            │
       ▼                          ▼                            ▼
  Classify P1-P4             Trigger Kill Switch          Deploy Tested Hotfix
  Page On-Call Lead          or Session Lockout           Run Regression Suite
                                                               │
                                                               ▼
[5. AUDIT ENTRY] <── [4. POST-MORTEM & CLOSURE] <──────────────┘
```

---

## 2. Emergency Containment Playbooks

### Playbook A: Cross-Tenant Data Leak Suspected
1. **Immediate Action**: Engage tenant kill switch in `AdminConsole` to suspend affected tenant session tokens.
2. **Database Investigation**: Inspect active PgBouncer connections and verify `AsyncLocalStorage` tenant contexts.
3. **Forensic Audit**: Query `AuditLog` table for out-of-tenant student lookups.
4. **Notification**: If student PII was exposed, notify Institutional Principal and Data Protection Board within statutory 6-hour window under DPDP Act 2023.

### Playbook B: Runaway SSRF / Outbound Scanning Attempt
1. **Immediate Action**: Revoke LMS API token; firewall blocks outbound HTTP requests to the target IP.
2. **Inspection**: Audit `allowedLmsHosts` table; verify `SSRFGuard` intercepted socket calls.
3. **Verification**: Confirm zero private AWS metadata queries reached EC2/ECS metadata endpoints.
