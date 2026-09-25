# YOUVA-EdAI — Strategy: Launch Jurisdiction & Regulatory Baseline
## Canonical Strategy Document | Phase 0 Scope Lock

**Status:** RATIFIED & LOCKED  
**Governing Regulation:** Digital Personal Data Protection Act, 2023 (DPDP Act) — India  
**Secondary Alignment:** US COPPA (16 CFR Part 312) & FERPA (34 CFR Part 99) Architectural Readiness  
**Date Locked:** 2026-09-25  

---

## 1. Selected Primary Jurisdiction: India (DPDP Act 2023)

### Why India as the Primary Launch Market
1. **Pilot Population Proximity:** The initial design partner classroom cohort (Delhi Public School, Class 7B) resides in the National Capital Region (Delhi NCR), India. Compliance must match where real student data originates.
2. **Statutory Clarity:** Section 9 of the DPDP Act 2023 provides an unambiguous legal boundary governing the processing of personal data of children (<18 years).
3. **Data Sovereignty:** Localizing cloud architecture in `ap-south-1` (Mumbai) guarantees zero cross-border transfer violations from day one.

---

## 2. Mandatory Statutory Compliance Controls (DPDP Section 9)

```
                            DPDP ACT 2023 (SECTION 9) DEFENSE MATRIX
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MANDATORY STATUTORY OBLIGATION            YOUVA-EdAI TECHNICAL IMPLEMENTATION                  │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Verifiable Parental Consent (s. 9(1))   • Dual-Key Consent: School Master DPA + Guardian    │
│                                              One-Time SMS/WhatsApp OTP token verification.     │
│ 2. Ban on Detrimental Processing (s. 9(2)) • Hard-capped 35-minute sessions to prevent screen  │
│                                              fatigue; zero casino-style engagement mechanics.  │
│ 3. Ban on Behavioral Tracking (s. 9(3))    • Strict Zero-Behavioral-Ad policy; zero third-party │
│                                              trackers, pixels, or profiling SDKs.              │
│ 4. Right to Erasure / Revocation (s. 12)   • Automated cascade shredding deleting all student  │
│                                              PII within 24 hours of parental consent withdrawal│
│ 5. Third-Party AI Isolation                • Zero-Data-Retention (ZDR) DPA executed with LLM  │
│                                              providers (prompts never used for model training).│
│ 6. Incident Reporting Timelines            • 6-hour CERT-In and Data Protection Board incident │
│                                              escalation runbook operationalized.               │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Explicitly Deferred Jurisdictions

1. **United States (COPPA/FERPA):** Architecture maintains readiness (no direct marketing, school-in-loco-parentis constructs), but formal state-level reviews (California SOPIPA, New York Ed Law 2-D) are deferred to Phase 9.
2. **European Union (GDPR-K & EU AI Act):** High-Risk AI conformity assessments and variable age thresholds (13–16) are deferred to Phase 9.
3. **United Kingdom (Age-Appropriate Design Code):** Deferred to Phase 9.
