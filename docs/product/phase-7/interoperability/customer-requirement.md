# YOUVA EdAI — Phase 7: LMS/SIS Customer Requirement Specification
## Demand-Gated Roster Synchronization Scope: DPS R.K. Puram (`allowedLmsHosts`)

---

## 1. Customer Context & Scope Gating

Phase 7 activates the LMS/SIS interoperability subsystem (P16) **exclusively on-demand** for Delhi Public School, R.K. Puram. 

### Hard Demand Constraint
The connector is strictly dormant by default. It can only be activated when a tenant presents an active enterprise contract explicitly designating pre-approved LMS hostnames.

---

## 2. In-Scope Integration Endpoints

Per Section 7 of `CONTRACT-DPSRKP-2026-SCALE`, the integration is strictly restricted to three hostnames:
1. `canvas.dpsrkp.net`: School Canvas LMS (Class 10 roster & assignment metadata).
2. `moodle.dpsrkp.net`: Departmental Moodle server (Supplementary quiz records).
3. `sis.dpsrkp.edu.in`: Core Student Information System (Official enrollment IDs).

All other external URLs, IP addresses, or unlisted third-party hostnames are **strictly blocked by the SSRF perimeter firewall**.

---

## 3. Data Sync Boundaries

- **Inbound Sync**: Imports student enrollment tokens, course IDs, and external homework completion flags.
- **Outbound Sync**: Prohibited from writing raw behavioral tracking logs or private teacher scratchpad notes to external systems.
- **Cryptographic Provenance**: Every imported record is tagged with an immutable SHA-256 provenance hash, recording source URL, fetch timestamp, and signature.
