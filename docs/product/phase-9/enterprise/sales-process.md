# YOUVA EdAI — Phase 9: Repeatable Institutional Sales System (C8)
## Twelve-Stage Sales Pipeline, Gate Exit Conditions, and Engineering Protection

---

## 1. Governance Objective

In scaling EdTech companies, informal sales commitments frequently create unmanageable technical debt:
> **Sales teams must never promise non-existent features, bypass security reviews, or commit engineering to custom compliance exceptions.**

The Phase 9 Institutional Sales System defines a deterministic 12-stage pipeline where every transition requires verifiable evidence and explicit role sign-offs.

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ 1. LEAD      │ ──> │ 2. QUALIFICATION  │ ──> │ 3. EDUCATIONAL NEED  │ ──> │ 4. SECURITY REVIEW │
└──────────────┘     └───────────────────┘     └──────────────────────┘     └─────────┬──────────┘
                                                                                      │
┌──────────────┐     ┌───────────────────┐     ┌──────────────────────┐               │
│ 8. CONTRACT  │ <── │ 7. PROCUREMENT    │ <── │ 6. PILOT EVALUATION  │ <── 5. COMPLIANCE  │
└──────┬───────┘     └───────────────────┘     └──────────────────────┘        REVIEW      │
       │                                                                                   │
       ▼                                                                                   │
┌──────────────┐     ┌───────────────────┐     ┌──────────────────────┐                    │
│ 9. IMPLEMENT │ ──> │ 10. TRAINING      │ ──> │ 11. PRODUCTION       │ ──> 12. RENEWAL    │
└──────────────┘     └───────────────────┘     └──────────────────────┘                    │
```

---

## 2. Twelve-Stage Pipeline & Gate Exit Conditions

| Stage | Name | Key Activity | Mandatory Exit Condition | Required Sign-Off |
|---|---|---|---|---|
| **Stage 1** | `LEAD` | Inbound request or target district outreach. | School district accredited; \(\ge 500\) students. | SDR Lead |
| **Stage 2** | `QUALIFICATION` | Validate budget authority, timeline, and decision committee. | B2B qualification memo completed. | Account Executive |
| **Stage 3** | `EDUCATIONAL_NEED`| Map district learning gaps to NCERT / CCSS curriculum graphs. | Curriculum graph fit confirmed (\(\ge 85\%\) overlap). | Head of Pedagogy |
| **Stage 4** | `SECURITY_REVIEW` | Provide Security & Compliance Data Room access. | District InfoSec approves architecture; zero deviations. | CISO |
| **Stage 5** | `COMPLIANCE_REVIEW`| Verify jurisdiction policy (`in-dpdp`, `us-coppa-ferpa`). | Data Processing Agreement (DPA) executed. | General Counsel / DPO |
| **Stage 6** | `PILOT_EVALUATION`| 30-day bounded pilot with 100–300 students. | Pilot success criteria met (\(\ge 80\%\) teacher NPS). | Pilot Operations Lead |
| **Stage 7** | `PROCUREMENT` | Formal tender / RFP response and pricing quotation. | District procurement board authorizes purchase order. | VP of Finance |
| **Stage 8** | `CONTRACT` | Multi-year institutional license agreement finalized. | Executed Master Services Agreement (MSA). | Chief Legal Officer |
| **Stage 9** | `IMPLEMENTATION` | Tenant provisioning, SSO integration, roster sync. | Tenant isolated in database; automated checks pass. | Technical Account Mgr |
| **Stage 10**| `TRAINING` | Professional development workshops for teachers and admins. | \(\ge 90\%\) of district teachers complete certification. | Customer Success Lead |
| **Stage 11**| `PRODUCTION` | Full cohort launch across all enrolled district schools. | Production telemetry nominal; SLA adherence \(\ge 99.9\%\). | VP of Operations |
| **Stage 12**| `RENEWAL` | Annual business review (ABR), usage audit, expansion. | Renewal agreement executed \(\ge 90\) days prior to expiry.| Chief Commercial Officer |

---

## 3. Engineering Protection Protocol

If a prospective customer demands custom software modifications during Stages 1–7:
- Sales reps are barred from committing development resources.
- The request must be submitted as an enhancement request to the Product Governance Committee.
- If the feature conflicts with the core learning loop, child safety invariants, or jurisdiction rules, it is **unilaterally rejected**.
