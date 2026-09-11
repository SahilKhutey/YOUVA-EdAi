# YOUVA-EdAI — Phase 2: Safety & Trust Architecture Specification

**Phase Target**: Safety & Trust Hardening  
**Regulatory Frameworks**: 
- Digital Personal Data Protection (DPDP) Act, 2023 (Section 9: *Processing of personal data of children*)
- Protection of Children from Sexual Offences (POCSO) Act, 2012
- IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021

---

## 1. Statutory Context & Scope

Under Section 9 of the India DPDP Act 2023:
1. A Data Fiduciary must obtain **verifiable consent** of the parent of such child or the lawful guardian before processing any personal data of a child.
2. A Data Fiduciary shall **not** undertake tracking or behavioral monitoring of children or targeted advertising directed at children.
3. A Data Fiduciary shall **not** undertake any processing of personal data that is likely to cause any detrimental effect on the well-being of a child.

YOUVA-EdAI Phase 2 hardens the platform to enforce these statutory requirements as hard architectural invariants.

---

## 2. Verifiable Parental Consent (VPC) Architecture

```
 Parent Browser / App                   YOUVA Backend                 SMS / DigiLocker
       │                                     │                               │
       │─── 1. Request VPC Challenge ───────>│                               │
       │    (parentId, studentId, type)      │─── 2. Generate 6-Digit OTP ──>│
       │                                     │    (Crypto Random, 10m TTL)   │
       │                                     │                               │
       │<── 3. Await OTP Input ──────────────│                               │
       │                                     │                               │
       │─── 4. Submit OTP ──────────────────>│                               │
       │                                     │─── 5. Validate OTP & Rate-Lim─┤
       │                                     │    Create HMAC Evidence Token │
       │                                     │    Status: VERIFIED           │
       │<── 6. Return Verified Consent ──────│                               │
```

### Invariants:
- **Fail-Closed Session Gate**: `ConsentManager.is_practice_permitted(student_id)` strictly verifies that an unrevoked, active `LEARNING_SERVICE` consent record exists. If missing or revoked, all learning, practice, and assessment sessions fail closed immediately.
- **Evidence Non-Repudiation**: Every verified consent produces an immutable SHA-256 HMAC evidence token binding parent identity, child identity, consent version, and verification timestamp.

---

## 3. Consent Revocation & 24-Hour Cryptographic Purge SLA

```
Parent Revokes Consent ──> Immediate Session Invalidation (Active JWTs/Tokens Voided)
                                      │
                                      ▼
                       24-Hour Purge Schedule Initiated
                                      │
                                      ▼
                       Automated Cryptographic Purge:
                       - Student PII (name, email, phone) zeroized
                       - Email replaced by one-way hashed internal tombstone
                       - Learning telemetry pseudonymized or purged
                       - Status transitioned to PURGED
```

---

## 4. Child Safety Escalation & Dual-Channel Dispatch

### Safety Trigger Categories & Severities

| Category | Severity | Examples / Patterns | Dispatch Requirement |
| :--- | :--- | :--- | :--- |
| `SELF_HARM` | `CRITICAL` | Suicidal ideation, cutting, wanting to die | Dual-Channel (SMS + Email + In-App) |
| `CHILD_ABUSE` | `CRITICAL` | Domestic violence, physical abuse, endangerment | Dual-Channel (SMS + Email + In-App) |
| `IMMEDIATE_DANGER` | `CRITICAL` | Weapon possession, threats of violence | Dual-Channel (SMS + Email + In-App) |
| `SEXUAL_HARASSMENT` | `HIGH` | Solicitation, inappropriate messages | Dual-Channel (SMS + Email + In-App) |
| `CYBERBULLYING` | `HIGH` | Humiliation, persistent insults, hate speech | Dual-Channel (SMS + Email + In-App) |
| `SUSPICIOUS_ADULT_CONTACT`| `HIGH` | Meeting requests, off-platform invitations | Dual-Channel (SMS + Email + In-App) |
| `EXTREME_DISTRESS` | `MEDIUM` | Severe panic attacks, academic breakdown | Single/Dual Channel (Email + In-App) |

### Permanent Invariant: AI Cannot Close Alone
Automated AI agents, LLMs, and background workers are strictly blocked from resolving safety incidents. Attempted closures throw `SafetyGovernanceViolation`. Only authenticated human educators, counselors, or safeguarding officers can resolve incidents by providing:
1. Written pedagogical/safeguarding rationale ($\ge 10$ characters).
2. Cryptographic digital signature ($\ge 16$ characters).

---

## 5. Tamper-Evident HMAC-SHA256 Audit Ledger

Every privileged event (consent grant, consent revocation, session start, safety escalation, incident resolution, purge execution) is recorded in an append-only forward hash chain:

$$H_0 = \text{"0"}^{64} \quad (\text{Genesis Hash})$$
$$H_n = \text{HMAC-SHA256}\left(K, n \parallel \text{eventId} \parallel \text{timestamp} \parallel \text{actorId} \parallel \text{actorRole} \parallel \text{action} \parallel \text{resource} \parallel \text{outcome} \parallel \text{metadata} \parallel H_{n-1}\right)$$

### Tamper Detection
Any modification of past events, alteration of metadata, or broken hash pointer is immediately flagged by `verify_chain_integrity()`, identifying the exact sequence number that was violated.
