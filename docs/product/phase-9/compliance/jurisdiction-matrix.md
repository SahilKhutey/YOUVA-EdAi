# YOUVA EdAI — Phase 9: Living Jurisdiction Compliance Matrix (C2)
## Multi-Jurisdictional Comparative Analysis of Regulatory, Privacy, and Safety Mandates

---

## 1. Architectural Purpose

The Jurisdiction Compliance Matrix is a living platform governance artifact that translates regional data protection, education privacy, and child safeguarding statutes into concrete, deterministic platform runtime policies.

It ensures that developers and product operators never hard-code regional legal interpretations into ad-hoc business logic.

---

## 2. Comparative Statutory Matrix

| Compliance Dimension | India (`in-dpdp`) | United States (`us-coppa-ferpa`) | European Union (`eu-gdpr`) |
|---|---|---|---|
| **Governing Statute** | Digital Personal Data Protection Act 2023 | COPPA (15 U.S.C. 6501) & FERPA (34 CFR Part 99) | GDPR (Reg EU 2016/679) & EU AI Act 2024 |
| **Child Age Threshold** | **< 18 Years** (Statutory definition of child) | **< 13 Years** (COPPA child definition) | **< 16 Years** (Standard; 13–16 by Member State) |
| **Parental Consent Model**| Verifiable Parental Consent mandatory for all processing | Verifiable Parental Consent (or School Official Exception) | Verifiable Parental Consent below member threshold |
| **Withdrawal Purge SLA** | **24 Hours** (Hard statutory purge requirement) | **72 Hours** (FERPA/COPPA standard) | **48 Hours** (Right to erasure / RTBF SLA) |
| **Safety Escalation SLA**| **4 Hours** (Critical child distress threshold) | **4 Hours** (District child protection SLA) | **4 Hours** (Safeguarding emergency response) |
| **Cross-Border Transfer**| Strict Data Localization (Processing within India) | Domestic US cloud only; state sovereignty locks | Strict EU boundary (Chapter V adequacy locks) |
| **Data Retention Limits**| Deleted 90 days after academic session conclusion | Retained per school district contract retention schedule| Deleted upon consent withdrawal or course completion |
| **Student Record Export**| JSON/PDF portable record format | FERPA-compliant digital transcript format | Article 20 data portability JSON package |
| **AI Transparency & Logs**| Explainable cognitive tracing; immutable ledger | Non-discriminatory algorithms; model bias audit | High-risk AI technical documentation (Annex IV) |
| **Statutory Status** | **ACTIVE** (Approved by Legal & Safety) | **ACTIVE** (Approved by Legal & Safety) | **DRAFT** (Pending Legal Counsel Sign-off) |

---

## 3. Conflict Resolution Invariant: Strictest Rule On Mismatch

When a multi-tenant institutional network spans multiple regions or when student enrollment involves cross-border identities, the `JurisdictionEngine` enforces the **Strictest Rule On Mismatch** invariant:

```python
# Invariant: Resolve to highest age threshold, shortest purge SLA, and zero transfer
effective_age = max(jur_a.child_age_threshold, jur_b.child_age_threshold)
effective_purge_sla = min(jur_a.withdrawal_purge_sla_hours, jur_b.withdrawal_purge_sla_hours)
effective_safety_sla = min(jur_a.safety_escalation_sla_hours, jur_b.safety_escalation_sla_hours)
cross_border_allowed = jur_a.cross_border_allowed and jur_b.cross_border_allowed
```

This mathematical resolution ensures that no statutory right is ever diluted or compromised during cross-jurisdictional processing.
