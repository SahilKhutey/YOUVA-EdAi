# Skills Passport Specification: W3C VC 2.0 & Open Badges 3.0

## 1. Architectural Overview
The YOUVA-EdAi Skills Passport issues tamper-evident, cryptographically signed micro-credentials verifying student subject-matter competencies.

---

## 2. Fundamental Governance Invariants

### 2.1 The Zero-PII Public Invariant
Under DPDP Act 2023 §9 and FERPA/COPPA principles:
- **No Direct PII in Credential Subject**: The credential MUST NOT leak the student's legal name, email, telephone number, residential address, Aadhaar number, or date of birth.
- **Pseudonymized DID**: The student subject is referenced by a deterministic Decentralized Identifier:
  $$\text{did:youva:student:} \parallel \text{hex}(\text{SHA-256}(\text{raw\_student\_id}))[:16]$$
- **Verification Token Hash**: A 64-character SHA-256 hash anchoring evidence off-chain.

### 2.2 Mandatory Human Authorization Invariant
- **Strict Rule**: AI models, automated grading loops, and autonomous agents **CANNOT issue credentials alone**.
- Every issued credential MUST contain a verified `teacherAuthorization` block with:
  - Valid `teacherId` of a certified human faculty member.
  - Decision explicitly equal to `APPROVED`.
  - Cryptographic digital signature of the educator.
- Violations trigger an immediate fail-closed `HumanAuthorizationRequiredError`.

### 2.3 Anti-Gaming Criteria
To prevent credential inflation and automated guessing:
1. **Questions Answered**: $\ge 15$ independent items.
2. **Time on Task**: $\ge 45.0$ minutes of deliberate practice.
3. **Accuracy**: $\ge 80.0\%$ independent correct response rate.
4. **BKT Mastery**: $\ge 0.85$ Corbett & Anderson posterior probability.

---

## 3. Cryptographic Verification Standard
- **Signature Suite**: HMAC-SHA256 / Ed25519 canonical digest proof.
- **Tamper Evident**: Any modification to evidence metrics, achievement codes, or dates invalidates the proof value.
- **Offline Verification**: QR-code export contains minimal tuple `(credId, did, competencyCode, tokenHash, proofSig)` verifiable without central database access.
