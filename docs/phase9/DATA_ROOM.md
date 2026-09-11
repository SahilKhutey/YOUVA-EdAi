# YOUVA EdAI — Institutional Procurement Data Room & Sales Motion

## 1. Overview

School districts, educational boards, and enterprise institutions require verifiable trust, compliance attestations, and service level guarantees before procuring EdTech software. The YOUVA EdAI Institutional Data Room provides a standardized, pre-packaged assurance artifact for institutional sales, RFP questionnaires, and security reviews.

---

## 2. Data Room Structure (`data-room-index.json`)

The data room is indexed into five core sections:

```
DATA ROOM ARCHITECTURE
 ├── SEC-ARCH: Architecture & Security Whitepaper
 │    ├── DOC-ARCH-01: Trust Boundaries & Threat Model v2.0
 │    └── DOC-SEC-01: Zero-Trust Tenant Isolation & Encryption Key Management
 ├── SEC-COMPLIANCE: Independent Compliance & Legal Attestations
 │    ├── DOC-COMP-DPDP: India DPDP Act 2023 Statutory Compliance Opinion
 │    ├── DOC-COMP-COPPA: US COPPA / FERPA Independent Legal Audit Report
 │    └── DOC-SOC2-TYPE2: SOC 2 Type II Readiness Assessment Report
 ├── SEC-SLA: Service Level Agreement (SLA) & Incident Response Policy
 │    ├── DOC-SLA-01: Enterprise Institutional SLA (99.9% Availability & Financial Credits)
 │    └── DOC-INCIDENT-01: Security Incident Response & Child Safety Escalation Plan
 ├── SEC-CREDENTIALS: Verifiable Credential & Open Badges Technical Specifications
 │    ├── DOC-CRED-W3C: W3C VC 2.0 / Open Badges 3.0 Cryptographic Signature Standard
 │    └── DOC-ANTI-GAMING: Anti-Gaming, Speedrun Prevention & Human Signoff Invariants
 └── SEC-RFP: Standard Institutional RFP Questionnaire Library
      └── DOC-RFP-LIB: HECVAT / CAIQ / NSBA Pre-Populated RFP Answers
```

---

## 3. Institutional Service Level Agreement (SLA)

| Metric | Target | Remedies & Penalties |
| :--- | :--- | :--- |
| **Monthly Service Availability** | 99.90% | 10% credit (<99.9%), 25% credit (<99.5%), 50% credit (<99.0%) |
| **P1 Security Incident Escalation** | $\le 1$ Hour | Immediate failover; root cause analysis within 24h |
| **Child Safety Escalation SLA** | $\le 4$ Hours | Mandatory human safeguarding intervention |
| **Consent Withdrawal Purge SLA** | $\le 24$ Hours | Cryptographic purge certificate generated on completion |

---

## 4. Standard RFP Responses (Excerpt)

### Q: Does YOUVA EdAI use student data to train commercial AI models?
**A: No.** Student data is never utilized for foundational model training or shared with third-party LLM providers for commercial fine-tuning. Prompts are zero-retention, ephemeral, and sanitized via cryptographic pseudonymization.

### Q: How does the system handle student PII in public credentials?
**A: Zero-PII Public Verification Tokens.** Public verification payloads contain only a 64-character SHA-256 token hash (`verificationTokenHash = sha256(token)`). The verification ledger exposes only achievement competency codes and mastery scores without student names, emails, or biometric identifiers.

### Q: Can AI take disciplinary or grading action against students?
**A: No.** The human-authorization invariant mandates that all summative, credentialing, and grading decisions require verified human teacher signatures.
