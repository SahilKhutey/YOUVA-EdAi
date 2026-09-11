# YOUVA-EdAI — Phase 2: Threat Model & Security Review

**Assessment Type**: Independent Security Architecture Audit & STRIDE Threat Modeling  
**Review Lead**: Security & Trust Engineering Lead  
**Scope**: Consent Manager, Safety Escalation Engine, HMAC Audit Ledger, Child Data Protection  

---

## 1. Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector | Mitigation in Phase 2 | Status |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Student simulates guardian OTP to grant self-consent. | Cryptographic 6-digit OTP delivered out-of-band to parent phone/email with 10-minute TTL and max 3-attempt lockout. | **MITIGATED** |
| **Tampering** | Rogue actor modifies audit logs or removes safety incidents to conceal negligence. | HMAC-SHA256 hash chaining ($H_n = \text{HMAC}(K, \text{entry} \parallel H_{n-1})$). Any single-byte modification breaks chain verification. | **MITIGATED** |
| **Repudiation** | Teacher or Counselor denies taking an intervention or closing an incident. | Resolution requires explicit cryptographic digital signature and mandatory rationale bound to actor ID. | **MITIGATED** |
| **Information Disclosure** | Student PII persists in backups or databases after parent revokes consent. | Automated 24-hour cryptographic data purge replaces PII with irreversibly hashed tombstones (`purged_...`). | **MITIGATED** |
| **Denial of Service** | Flooding safety dispatcher with bogus requests to exhaust SMS quotas. | Severity gating, source validation, and rate-limiting on alert dispatch pipelines. | **MITIGATED** |
| **Elevation of Privilege** | AI tutor agent automatically dismisses critical child distress incidents to keep session going. | Hard architectural guard: `SafetyGovernanceViolation` raised fail-closed if `actor.role == 'AI'` or unauthorized. | **MITIGATED** |

---

## 2. Zero-Trust Boundaries & Fail-Closed Invariants

1. **The Consent Boundary**:
   - Every learner request passes through `is_practice_permitted(studentId)`.
   - Default state is **DENY**. Access is granted only when an active, unrevoked `LEARNING_SERVICE` consent record is cryptographically confirmed.
2. **The Safety Boundary**:
   - Safety monitoring runs as an independent policy interceptor.
   - Escalations cannot be cancelled, downgraded, or resolved by autonomous models. Only verified human credentials can sign off.
3. **The Audit Boundary**:
   - The ledger key is stored in a secure secret manager or HSM environment.
   - Chaining is continuous and monotonically sequenced ($0, 1, 2, \dots, N$).

---

## 3. Cryptographic Verification Sign-Off

- **HMAC Digest**: HMAC-SHA256 with minimum 256-bit secret key.
- **Evidence Tokens**: 64-character hex string binding $(P, S, C, T, V)$.
- **Audit Tamper Detection**: Verified across simulated byte corruption, metadata alterations, and broken hash pointer attacks.
