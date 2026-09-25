# YOUVA EdAI — Phase 5: Skills Passport Specification
## W3C Verifiable Credentials 2.0 & Open Badges 3.0 Data Model, Human Authorization, and Anti-Gaming Rules

---

## 1. Specification Overview

The **Skills Passport** is the micro-credentialing engine of YOUVA EdAI, introduced in Phase 5 for High School students. It packages authenticated student mastery into standards-compliant, tamper-evident verifiable credentials.

### 1.1 Guiding Standards
- **W3C Verifiable Credentials Data Model v2.0**
- **1EdTech Open Badges v3.0**
- **JSON-LD Compatibility** with cryptographic proof suites

### 1.2 Core Architectural Invariants

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SKILLS PASSPORT HARD INVARIANTS                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Zero-PII Invariant:                                                 │
│    Public credentials contain strictly NO personal data.               │
│    Subject identifier is a deterministic pseudonymized DID.            │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Human Authorization Invariant:                                      │
│    AI CANNOT issue credentials autonomously.                           │
│    Teacher digital signature is a hard prerequisite for issuance.      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Anti-Gaming Policy Invariant:                                       │
│    Mastery claims must be corroborated by four independent telemetry    │
│    thresholds (questions, time on task, accuracy, BKT confidence).      │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Cryptographic Tamper-Evidence:                                      │
│    HMAC-SHA256 signature calculated over canonicalized payload.         │
│    Any alteration in payload invalidates proof instantly.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. W3C VC 2.0 Credential Schema & JSON Data Model

A valid YOUVA Skills Passport credential conforms to the following schema:

```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
  ],
  "id": "urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential",
    "YouvaSkillsPassportCredential"
  ],
  "issuer": {
    "id": "did:youva:issuer:delhi-public-school",
    "name": "Delhi Public School, Sector XII, R.K. Puram"
  },
  "validFrom": "2026-09-08T10:15:30Z",
  "credentialSubject": {
    "id": "did:youva:student:3a7f8b9c0d1e2f3a",
    "achievement": {
      "id": "urn:youva:achievement:cbse:g10:math:quad-01",
      "type": ["Achievement"],
      "name": "Grade 10 Quadratic Equations & Polynomials Mastery",
      "description": "Demonstrated mastery of standard forms, discriminant evaluation, algebraic factorization, quadratic formula derivations, and word problem modeling under CBSE Grade 10 curriculum.",
      "criteria": {
        "narrative": "Satisfies Corbett & Anderson BKT P(L) >= 0.85 with validated independent accuracy >= 80%."
      }
    },
    "competencyCode": "MATH-G10-QUAD-01"
  },
  "evidence": [
    {
      "id": "urn:youva:evidence:session:89201",
      "type": ["Evidence"],
      "metrics": {
        "bktMasteryProbability": 0.92,
        "questionsAnswered": 22,
        "independentAccuracy": 0.86,
        "timeOnTaskMinutes": 62.5,
        "scaffoldingLevel": "INDEPENDENT"
      }
    }
  ],
  "teacherAuthorization": {
    "teacherId": "staff:dps:math:dr-anita-deshmukh",
    "name": "Dr. Anita Deshmukh",
    "role": "Senior Mathematics Faculty",
    "decision": "APPROVED",
    "authorizedAt": "2026-09-08T10:14:00Z",
    "overrideNotes": "Student demonstrated robust algebraic derivation during whiteboard challenge."
  },
  "proof": {
    "type": "HmacSha256Signature2026",
    "created": "2026-09-08T10:15:30Z",
    "verificationMethod": "did:youva:issuer:delhi-public-school#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "a9f87c2b64d3e8105..."
  }
}
```

---

## 3. Human Authorization Invariant

The issuance pipeline enforces a hard fail-closed gate:

```
[BKT Engine Reaches P(L) >= 0.85]
                 │
                 ▼
[Anti-Gaming Policy Evaluation]
   ├── Questions Answered >= 15
   ├── Time on Task >= 45 mins
   └── Independent Accuracy >= 80%
                 │
            (Passed)
                 │
                 ▼
[Credential In Review Queue]
                 │
                 ▼
[Teacher Manual Review & Digital Sign-off]
   ├── Teacher views student work & diagnostic trajectory
   └── Teacher inputs PIN / Session Signature
                 │
       ┌─────────┴─────────┐
    APPROVED            REJECTED
       │                   │
       ▼                   ▼
[Cryptographic Proof]   [Feedback Sent to Student;
[Credential Minted]      Credential Not Issued]
```

### 3.1 Prohibited AI Authority
If `teacher_authorization` is empty, missing, or indicates an automated role (e.g., `role: "ai_tutor"` or `role: "algorithm"`), the issuance engine raises `HumanAuthorizationRequiredError` and execution halts immediately.

---

## 4. Anti-Gaming Policy Specification

To prevent credential farming, answer memorization, or peer account sharing, the engine evaluates four simultaneous conditions (`AntiGamingRules`):

| Parameter | Threshold | Rationale |
|---|---|---|
| `min_questions_answered` | **$\ge 15$ questions** | Ensures statistically significant BKT observation count; prevents single lucky streaks from triggering mastery. |
| `min_time_on_task_minutes` | **$\ge 45.0$ minutes** | Verifies deliberate engagement; eliminates rapid automated script clicking or superficial speed-running. |
| `min_independent_accuracy` | **$\ge 80.0\%$ ($0.80$)** | Unscaffolded accuracy on first attempt; prevents brute-force hint exhaustion from masking lack of true mastery. |
| `min_bkt_mastery` | **$\ge 85.0\%$ ($0.85$)** | Bayesian probability $P(L_t)$ incorporating slip and guess probabilities ($P(S)=0.10, P(G)=0.20$). |

---

## 5. Verification Endpoint Specification

External institutions (universities, internship programs, school boards) verify credentials through a lightweight, Zero-PII public endpoint:

- **Method**: `GET`
- **Route**: `/api/v1/credentials/verify/:token_hash`
- **Response**:
```json
{
  "valid": true,
  "status": "ACTIVE",
  "credentialId": "urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "title": "Grade 10 Quadratic Equations & Polynomials Mastery",
  "domain": "CBSE Class 10 Mathematics",
  "issuer": "Delhi Public School, Sector XII, R.K. Puram",
  "issuedAt": "2026-09-08T10:15:30Z",
  "evidenceCount": 1,
  "verifiedBy": "Dr. Anita Deshmukh (Senior Mathematics Faculty)"
}
```
*Notice: Zero names, zero emails, zero student personal identifiers are returned.*
