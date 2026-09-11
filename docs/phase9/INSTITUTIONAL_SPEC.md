# YOUVA EdAI — Phase 9 Institutional & Market Scale Specification

## 1. Executive Overview

Phase 9 marks the transition of YOUVA EdAI from a single-jurisdiction, three-tier pilot platform into a durable, multi-jurisdiction, institutional-grade educational ecosystem.

While lower phases (Phase 0–8) established pedagogical efficacy, deterministic BKT mastery, zero-PII data architectures, verifiable parental consent, and cost/drift circuit breakers, Phase 9 codifies the **Institutional Trust Plane**. This plane enables institutional procurement by national school boards, state education departments, and international school consortiums without weakening safety boundaries.

---

## 2. Multi-Jurisdiction Architecture & Failover Routing

The platform dynamically binds every tenant session to a verified jurisdiction profile declared in `phase9/jurisdictions/registry.json`.

```
                    ┌─────────────────────────┐
                    │     Tenant Request      │
                    │ (Header / GeoIP / Realm)│
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Jurisdiction Resolver  │
                    │  (Enforces Strictest)   │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     IN-DPDP      │  │  US-COPPA-FERPA  │  │   Failover Default│
│  Age Threshold:  │  │  Age Threshold:  │  │     (IN-DPDP)     │
│     18 Years     │  │     13 Years     │  │  Fail-Closed Safe │
│ Purge SLA: 24h   │  │ Purge SLA: 48h   │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.1 Supported Regulatory Profiles

1. **India — DPDP Act 2023 (`in-dpdp.json`)**:
   - **Child Age Threshold**: 18 years (Section 9).
   - **Parental Consent**: Verifiable Parental Consent via OTP or DigiLocker integration.
   - **Withdrawal Purge SLA**: Strict 24-hour cryptographic purge.
   - **Cross-Border Transfer**: Prohibited; strictly in-region data residency.
   - **Behavioral Profiling**: Absolute prohibition on tracking and targeted advertising.

2. **United States — COPPA / FERPA (`us-coppa-ferpa.json`)**:
   - **Child Age Threshold**: 13 years (COPPA).
   - **Parental Consent**: School Official Exception under FERPA 34 CFR § 99.31 or Verifiable Parental Consent.
   - **Withdrawal Purge SLA**: 48-hour data erasure.
   - **Audit Rights**: Annual institutional record inspection.

3. **European Union — GDPR (`eu-gdpr.json`) [Draft Candidate]**:
   - Candidate status gated behind legal and child-safety sign-offs before multi-region activation.

### 2.2 Conflict Resolution Invariant
When tenant geolocation and user profile mismatch, the system automatically binds to the **strictest child age threshold and shortest purge SLA** between the conflicting jurisdictions.

---

## 3. Human Authorization Invariant at Scale

As institutional scale expands to hundreds of thousands of students, the invariant established in Phase 0 remains untouched:

$$\text{AI Suggests} \quad \Longrightarrow \quad \text{Human Teacher Authorizes} \quad \Longrightarrow \quad \text{Consequential Action Executed}$$

- **No Autonomous Grading**: Summative assessments and credential assertions cannot be finalized without a verified human teacher signature (`teacherAuthorization.signature`).
- **No Autonomous Content Injection**: Curriculum units and question banks require dual-signoff by curriculum leads before entering the adaptive pool.
- **Circuit Breaker Rollback**: If safety evaluation detects $\ge 5\%$ accuracy or safety drift, the model automatically rolls back to fallback deterministic templates.

---

## 4. Verification & Validation Commands

To verify institutional compliance and readiness gates:

```powershell
# Run all Phase 9 verification checks
python phase9/scripts/validate_phase9_gate.py

# Run comprehensive test suite
python -m pytest phase9/tests -v
```
