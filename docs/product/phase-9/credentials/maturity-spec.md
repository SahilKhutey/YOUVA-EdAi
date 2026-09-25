# YOUVA EdAI — Phase 9: Skills Passport Credential Maturity Specification (C4)
## Evolution from Phase 5 Credential MVP to Institutional Credential Ecosystem

---

## 1. Executive Context & Evolution

In Phase 5, the Skills Passport was introduced as a minimal verifiable credential MVP. In Phase 9, P15 matures into an institutional **Verifiable Credential Ecosystem** compliant with **W3C Verifiable Credentials Data Model 2.0** and **1EdTech Open Badges 3.0**.

### Governing Invariant
> **Not every learning achievement is a credential. Credential issuance requires proven mastery, anti-gaming validation, and mandatory human teacher authorization.**

```
                     STUDENT PRACTICE & MASTERY
                                 │
                                 ▼
                     SESSION INTEGRITY REPORT
                 (Anti-Gaming Anomaly Detection)
                                 │
                                 ▼
                     CREDENTIAL ELIGIBILITY GATE
                                 │
                                 ▼
                   HUMAN TEACHER AUTHORIZATION
                  (Cryptographic Digital Signature)
                                 │
                                 ▼
                     CREDENTIAL ISSUANCE
               (Zero-PII 256-Bit Token & Hash)
```

---

## 2. Credential Governance Policy Schema (`CredentialPolicy`)

Every issued credential type is defined by a strict policy contract:

```typescript
export interface CredentialPolicy {
  credentialType: string;                   // e.g. "YOUVA-COMPETENCY-CREDENTIAL-V1"
  eligibleTiers: string[];                  // ["MIDDLE_SCHOOL", "HIGH_SCHOOL"]
  requiredEvidence: string[];               // Minimum questions, time, independent accuracy
  teacherAuthorizationRequired: boolean;   // MANDATORY: Must be TRUE
  minimumEvidenceAgeDays: number;           // Evidence retention window
  duplicatePolicy:
    | "BLOCK_DUPLICATE_ACTIVE"             // Cannot issue if active credential exists
    | "ALLOW_HIGHER_MASTERY_UPGRADE";      // Allows upgrade on significant score delta
  revocationPolicy:
    | "TEACHER_INITIATED"                  // Teacher flags academic dishonesty
    | "SAFETY_BREACH_AUTOMATED";           // Automated revocation upon critical fraud
  publicVerificationEnabled: boolean;      // Zero-PII public cryptographic verifier
}
```

---

## 3. Human Teacher Authorization Invariant

Autonomous AI agents, heuristic scripts, or automated pipelines are **permanently barred** from issuing verifiable credentials.
- `CredentialEngine.issue_credential()` enforces:
  ```python
  if issuer_role == "AUTONOMOUS_AI_AGENT" or not is_teacher_signature_present:
      raise AutonomousCredentialIssuanceForbiddenError(
          "Permanent Invariant Violation: Verifiable credentials require certified human teacher authorization."
      )
  ```
- Any attempt by an AI actor to trigger credential issuance fails closed with `AutonomousCredentialIssuanceForbiddenError`.

---

## 4. Revocation Lifecycle

Credentials can be revoked by authorized school personnel (e.g., following discovery of academic dishonesty, proctoring invalidation, or parental withdrawal).
- Revoked credential IDs are recorded in an append-only revocation registry with an ISO 8601 timestamp and SHA-256 reason code hash.
- Once revoked, the public verification endpoint returns:
  ```json
  {
    "status": "REVOKED",
    "valid": false,
    "revokedAt": "2026-09-25T01:59:49Z",
    "reason": "ACADEMIC_INTEGRITY_VIOLATION"
  }
  ```
- Revoked credentials cannot be re-activated. A new credential requires complete re-assessment and fresh human authorization.
