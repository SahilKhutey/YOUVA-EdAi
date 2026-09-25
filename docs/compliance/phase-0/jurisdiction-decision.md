# D02 — Launch Jurisdiction Decision Record

## Pilot Location
National Capital Region (Delhi NCR), India.

## Launch Jurisdiction
Candidate: **India**

## Governing Legal/Regulatory Framework
Candidate: **Digital Personal Data Protection Act, 2023 (DPDP Act)**

## Processing Context
- **Student Users:** Minors (under 18 years per DPDP Act section 2(f)).
- **Teacher Users:** Adult school employees acting in instructional capacity.
- **Parent/Guardian Users:** Adult legal guardians providing consent under section 9(1).
- **School/Institution:** Acting in educational partnership / institutional capacity.
- **Data Controller / Fiduciary Roles:** YOUVA EdAI operates as Data Fiduciary; partner school operates as institutional intermediary/fiduciary.
- **AI Providers:** Cloud LLM APIs (Google Gemini API / Anthropic / Local models) accessed via backend server.
- **Hosting Providers:** AWS / Cloud datacenter located in `ap-south-1` (Mumbai).
- **Third-Party Services:** SMS/OTP delivery gateways (e.g. Twilio / Exotel).

## Required Legal Review (Blocking Artifact)
- **Reviewer:** External Qualified Technology & Privacy Legal Counsel
- **Firm:** Technology & Data Privacy Practice (To be retained)
- **Date:** PENDING
- **Scope:** Applicability of DPDP Act Section 9 (Child Data), Verifiable Parental Consent requirements, liability boundaries, and subprocessor DPAs.
- **Opinion / Reference:** `docs/compliance/phase-0/legal-review.md` (MUST BE COMPLETED BEFORE LOCK)

## Engineering Consequences
- Implementation of verifiable parental consent mechanism before student account activation.
- Absolute technical ban on behavioral tracking, third-party advertising SDKs, and profiling.
- Automated data shredding mechanism with 24-hour purge SLA upon consent revocation.

## Deferred Jurisdictions
- United States (COPPA / FERPA)
- European Union (GDPR-K / EU AI Act)
- United Kingdom (Age-Appropriate Design Code)

## Status
**PENDING LEGAL REVIEW** (Legal review is an explicit blocking artifact; legal conclusions are not assumed).
