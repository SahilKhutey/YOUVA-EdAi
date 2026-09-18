# YOUVA-EdAI — N12 Skills Credential Charter
## Architecture, Security, Cryptography & Privacy Invariants

### 1. Architectural Invariant: The Three Truths (Clause N12.82)
YOUVA-EdAI enforces an unbreachable separation across three distinct systemic truths:
1. **LEARNING TRUTH**: *"What has the learner learned?"*
   - Internal mastery scores, learning telemetry, concept traversal, practice attempts.
   - Dynamic, probabilistic, formative.
2. **EVIDENCE TRUTH**: *"What evidence demonstrates it?"*
   - Concrete artifacts, scored assessments, validated project submissions, teacher rubric evaluations.
   - Versioned, multi-source, immutable.
3. **CREDENTIAL TRUTH**: *"What achievement has an authorized issuer formally attested to?"*
   - Cryptographically signed attestations (W3C VC & Open Badges), human authorization records, public status registry.
   - Consequential, portable, externally verifiable, revocable.

> [!CAUTION]
> **Cardinal Invariant**: These three layers must **never** be collapsed into a single database field, automated rule, or autonomous AI decision.

---

### 2. Skill ≠ Lesson Invariant (Clause N12.7)
- A lesson is an instructional unit of curricular delivery.
- A skill is an observable, transferable capability demonstrated across diverse evidence types.
- **Rule**: Completing 10 lessons ≠ skill demonstrated. Eligibility requires satisfying explicit multi-source evidence criteria (practice + formal assessment + authentic project + teacher review).

---

### 3. Evidence Quality Hierarchy (Clause N12.9)
Evidence is categorized into five strict quality tiers:
- **Level 1 (Practice)**: Low-stakes exercises, interactive drills, formative checks.
- **Level 2 (Assessment)**: Timed unit assessments, validated quizzes, proctored evaluations.
- **Level 3 (Validated Project)**: Multi-step artifacts, software builds, research papers, data analyses.
- **Level 4 (Teacher-Reviewed Performance)**: Rubric-scored project presentations, viva voce, direct observation.
- **Level 5 (Independently Verified)**: External jury review, competition awards, industry benchmark audits.

---

### 4. Credential Lifecycle State Machine (Clause N12.13)
All credentials transition strictly through governed lifecycle states:
$$\text{DRAFT} \longrightarrow \text{ELIGIBLE} \longrightarrow \text{PENDING\_REVIEW} \longrightarrow \text{APPROVED} \longrightarrow \text{ISSUED} \longrightarrow \text{ACTIVE} \longrightarrow \text{SUSPENDED} \longrightarrow \text{REVOKED} \longrightarrow \text{EXPIRED}$$

- **Revocation Invariant**: A credential can be revoked only by authorized human educators or institutional compliance officers with an explicit reason code:
  `ADMINISTRATIVE_ERROR` | `FRAUD` | `INVALID_EVIDENCE` | `POLICY_VIOLATION` | `CREDENTIAL_SUPERSEDED` | `ISSUER_CORRECTION`.
- Revocation **never** deletes the database record; the historic record remains immutable with status set to `REVOKED` and revocation metadata attached.

---

### 5. Human Authorization Gate (Clauses N12.11, N12.14, N12.59)
- The AI Engine may calculate eligibility, recommend pathways, and pre-fill rubric suggestions.
- **Strict Prohibition**: The AI engine is structurally forbidden from unilaterally approving or issuing consequential credentials where policy mandates human review.
- High-school graduation, capstone, and Level 3+ micro-credentials require explicit educator cryptographic signing or dual-authorization approval.

---

### 6. Cryptographic Architecture & Key Management (Clauses N12.19, N12.47-48)
- **Issuer DID**: `did:youva:issuer:delhi-ncr-node-01`
- **Signature Suite**: Ed25519Signature2020 / HMAC-SHA256 with key ID tracking (`kid`).
- **Key Rotation**: Cryptographic keys are rotated systematically. Historical keys are archived with validity windows.
- **Key Compromise Protocol**: If a key is marked compromised, all credentials signed with that key after the compromise timestamp are immediately marked invalid upon public verification.
- **Zero Secrets in Git/Client**: Private signing keys are stored exclusively in secure key vaults or environment secrets, never exposed in client bundles or public API responses.

---

### 7. Privacy-Preserving Public Verification (Clauses N12.21-22, N12.49-50, N12.75)
- Public verification is unauthenticated and accessible to any external university, employer, or audit system.
- **Data Minimization Guarantee**: Public verifiers receive:
  - Credential validity status (`VALID`, `REVOKED`, `SUSPENDED`, `EXPIRED`)
  - Issuer name and DID
  - Credential title and description
  - Issuance and expiration dates
  - Evidence count summary (e.g. "Supported by 4 validated evidence items")
- **Strict Concealment**: Public verification responses **never** include:
  - Full learner transcript or learning history
  - Private teacher comments or internal notes
  - Formative practice scores or unrelated skills
  - Learner email, physical address, or phone number

---

### 8. Academic Integrity & AI Assistance Disclosure (Clauses N12.43-45)
- Project-based work explicitly records learner disclosure of AI assistance across 4 dimensions:
  1. Brainstorming & ideation
  2. Code generation & debugging
  3. Content editing & polishing
  4. Research synthesis
- Human contribution must be explicitly recorded:
  - Problem framing & architecture
  - Critical design decisions
  - Unit testing & verification
  - Personal learning reflection
- Submissions undergo authenticity heuristics to prevent whole-project synthetic paste attacks.
