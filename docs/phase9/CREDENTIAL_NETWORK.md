# YOUVA EdAI — Verifiable Credential Network & Anti-Gaming Architecture

## 1. Overview

As students achieve mastery across learning standards, YOUVA EdAI issues portable, verifiable credentials that can be shared with higher educational institutions, employers, and parent portfolios.

Phase 9 formally standardizes this on:
1. **W3C Verifiable Credentials Data Model v2.0**
2. **1EdTech Open Badges Specification v3.0**
3. **Zero-PII Public Verification Tokens**
4. **Deterministic Anti-Gaming & Speedrun Protection**

---

## 2. Zero-PII Verification Token Architecture

Traditional badges embed student names and emails, creating severe privacy risks when shared publicly. YOUVA EdAI implements an asymmetric zero-PII token hashing design:

$$\text{Token} \xleftarrow{\$} \{0,1\}^{256}$$
$$\text{verificationTokenHash} = \text{SHA-256}(\text{Token})$$

```
                   Student Private Token
                   (Bearer in Session)
                            │
                            ▼
              ┌───────────────────────────┐
              │  SHA-256 Hash Generation  │
              └─────────────┬─────────────┘
                            │
                            ▼
                Public Verification Token
                (Safe for Public Ledger)
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│       Credential Subject        │   │       Verification Ledger       │
│ - ID: urn:youva:student:<hash>  │   │ - Competency: MATH-G8-ALG-01   │
│ - Achievement: Linear Equations │   │ - Mastery: 0.92                 │
│ - Evidence: 25 items, 88% acc   │   │ - Teacher Signature: Validated  │
│ - ZERO student name/email/PII   │   │ - Issuer: Verified Institution  │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 3. Anti-Gaming & Credential Integrity Rules (`anti-gaming.json`)

To prevent credential inflation, bots, and speedrunning, every credential recommendation must pass strict algorithmic validation before reaching a teacher:

1. **Minimum Question Volume**: $\ge 20$ independent items answered.
2. **Minimum Time-on-Task**: $\ge 45$ cumulative active practice minutes.
3. **Accuracy Ceiling**: $\ge 80\%$ accuracy on unassisted items.
4. **Hint / Assistance Ceiling**: Maximum $25\%$ of items may use pedagogical hints.
5. **Speedrun Anomaly Filter**: Any response submitted in $< 8$ seconds is flagged as an anomaly; $\ge 2$ speedrun items invalidate the mastery session.
6. **Teacher Authorization Invariant**: `aiCanIssueIndependently` is strictly `false`. Every credential requires human teacher digital signature.

---

## 4. W3C VC 2.0 / Open Badges 3.0 Conformance

The schema defined in `phase9/credentials/credential.schema.json` guarantees full interoperability with global credential wallets (e.g., Learner Credential Wallet, Open Badges Passport) without leaking student PII.
