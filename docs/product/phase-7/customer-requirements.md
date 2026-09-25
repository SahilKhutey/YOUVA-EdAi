# YOUVA EdAI — Phase 7: Customer Requirements Specification
## Institutional Demand Contract Analysis: Delhi Public School, R.K. Puram (`CONTRACT-DPSRKP-2026-SCALE`)

---

## 1. Institutional Customer Profile

- **Institution**: Delhi Public School, Sector XII, R.K. Puram, New Delhi.
- **Contract Identifier**: `CONTRACT-DPSRKP-2026-SCALE`.
- **Authorized Signers**:
  - Padma Bandopadhyay (Principal & Institutional Head)
  - Dr. Alok Verma (Director of Educational Technology)
- **Deployment Scope**: 250 Secondary School Students (Grades 8, 9, and 10 Mathematics).
- **Term Window**: August 1, 2026 – July 31, 2027 (Annual Institutional License).

---

## 2. Mandatory Contractual Requirements & SLAs

```
┌────────────────────────────────────────────────────────────────────────┐
│               DPS R.K. PURAM INSTITUTIONAL REQUIREMENTS                │
├────────────────────┬───────────────────────────────────────────────────┤
│ Domain             │ Contractual Requirement & Verification Standard   │
├────────────────────┼───────────────────────────────────────────────────┤
│ 1. Tenant Data     │ STRICT LOGICAL ISOLATION. Zero leakage of DPS     │
│    Isolation       │ student records, teacher feedback, or diagnostic  │
│                    │ data to any other school tenant.                  │
├────────────────────┼───────────────────────────────────────────────────┤
│ 2. Seat Quotas &   │ HARD QUOTA AT 250 SEATS. System must block over-  │
│    Licensing       │ subscription with a clear administrative alert;   │
│                    │ zero unmetered or orphaned user provisioning.     │
├────────────────────┼───────────────────────────────────────────────────┤
│ 3. Service Level   │ 99.9% MONTHLY AVAILABILITY during school hours    │
│    Agreement (SLA) │ (07:30 to 18:30 IST, Monday through Saturday).    │
├────────────────────┼───────────────────────────────────────────────────┤
│ 4. LMS/SIS Sync    │ ON-DEMAND ROSTER INGESTION restricted strictly to │
│    Boundaries      │ `canvas.dpsrkp.net`, `moodle.dpsrkp.net`, and     │
│                    │ `sis.dpsrkp.edu.in`. Zero access to external IPs. │
├────────────────────┼───────────────────────────────────────────────────┤
│ 5. Data Privacy    │ FULL INDIA DPDP ACT 2023 COMPLIANCE. All data     │
│    & Sovereignty   │ hosted in AWS Mumbai; verifiable parental consent │
│                    │ records accessible for school audit inspection.   │
├────────────────────┼───────────────────────────────────────────────────┤
│ 6. Support & P1    │ < 1 HOUR P1 INCIDENT RESPONSE SLA. Direct phone/  │
│    Escalations     │ Slack paging to YOUVA on-call engineer.           │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 3. Pedagogical Authority Invariant

Per Section 8.2 of the institutional agreement:
> *"The automated system shall not have the authority to alter official school grade cards or transcript records. External assignment scores imported via SIS/LMS connectors shall serve as supplementary evidence, requiring the affirmative manual authorization of the certified classroom educator before impacting student competency status."*

This legal stipulation affirms YOUVA's foundational invariant: **AI recommends, humans authorize.**
