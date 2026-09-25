# YOUVA EdAI — Phase 5: Privacy Policy & Adolescent Visibility Architecture
## India DPDP Act 2023 §9 Compliance, Parent-Student Permission Matrix, and Zero-PII Boundaries

---

## 1. Regulatory Context & Legal Grounding

Phase 5 addresses High School students in India (specifically Grade 10, ages 14–16). Under the **Digital Personal Data Protection (DPDP) Act, 2023**:
- **Section 9(1)** mandates verifiable parental consent (VPC) before processing any personal data of a child (defined as an individual who has not completed 18 years of age).
- **Section 9(2)** strictly prohibits any processing of personal data that is likely to cause any detrimental effect on the well-being of a child.
- **Section 9(3)** prohibits tracking, behavioral monitoring, or targeted advertising directed at children.

### 1.1 The Adolescent Autonomy Paradox
While DPDP Act 2023 categorizes all individuals under 18 as children requiring parental consent, 14–16 year old adolescents demonstrate emerging legal and intellectual autonomy. A parent-monitored system that exposes every raw draft or practice mistake to parents creates severe anxiety and undermines genuine self-regulated learning.

YOUVA EdAI solves this through a **Bifurcated Visibility Architecture**:
1. **Parental Authority**: Retains legal consent, account creation, data subject rights (access, erasure, withdrawal), and aggregate milestone progress visibility.
2. **Student Private Workspace**: Protects granular formative practice trials, intermediate working notes, and real-time diagnostic attempts from punitive surveillance.
3. **Public Boundary**: Strictly Zero-PII cryptographic micro-credentials for external validation.

---

## 2. Parent vs. Student vs. Teacher Permission Matrix

| Data Domain | Student (Age 14–16) | Parent / Guardian | Teacher / School | Public Endpoint |
|---|---|---|---|---|
| **Legal Consent Management** | View Only | Full Control (Grant / Revoke) | Verify Only | None |
| **Data Deletion / Export Requests** | Can Request (Subject to Parent Confirmation) | Full Authority to Execute | Notification Only | None |
| **Real-time Diagnostic Raw Answers** | Full Visibility | Summary Level Only (Mastery %) | Full Formative Visibility | None |
| **Practice Scratchpad & Notes** | Private to Student | Inaccessible | Inaccessible (unless submitted) | None |
| **Concept Mastery Probabilities $P(L)$** | Full Visibility | Milestone Summary | Full Class Analytics | None |
| **Attendance & Deliberate Practice Time** | Full Visibility | Summary Total Hours | Full Session Logs | None |
| **Skills Passport Credentials** | Owns & Shares | View & Share | Authorizes & Issues | Validates Token (Zero-PII) |
| **Identifiable Identity (Name, Aadhaar, DOB)** | Private Profile | Account Owner | School Roster Context | **STRICTLY STRIPPED (Zero-PII)** |

---

## 3. Server-Side Visibility Policy Implementation

Visibility enforcement is executed server-side via `VisibilityPolicyInterceptor` and cannot be bypassed by client manipulation:

```typescript
// backend/src/privacy/policies/visibility.policy.ts

export enum Role {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  PUBLIC = 'PUBLIC'
}

export interface AccessContext {
  requesterId: string;
  requesterRole: Role;
  targetStudentId: string;
}

export class HighSchoolVisibilityPolicy {
  public static filterStudentData(data: any, ctx: AccessContext): any {
    // 1. Public requests are stripped of all PII and formative logs
    if (ctx.requesterRole === Role.PUBLIC) {
      return {
        credentialId: data.credentialId,
        competencyCode: data.competencyCode,
        achievementName: data.achievementName,
        issuedAt: data.issuedAt,
        issuer: data.issuer,
        verificationStatus: data.verificationStatus,
        // Zero PII invariant: No name, no email, no DOB, no school roster ID
      };
    }

    // 2. Parent requests receive milestone-level progress without raw trial surveillance
    if (ctx.requesterRole === Role.PARENT) {
      return {
        summaryMastery: data.summaryMastery,
        competencyCode: data.competencyCode,
        completedMilestones: data.completedMilestones,
        totalTimeSpentHours: Math.round(data.totalTimeSpentMinutes / 60),
        credentialsEarned: data.credentialsEarned,
        // Raw formative mistakes omitted to preserve psychological safety
      };
    }

    // 3. Student receives full personal metacognitive telemetry
    if (ctx.requesterRole === Role.STUDENT && ctx.requesterId === ctx.targetStudentId) {
      return data;
    }

    // 4. Teacher receives formative diagnostic analytics for classroom intervention
    if (ctx.requesterRole === Role.TEACHER) {
      return {
        studentDid: data.studentDid,
        conceptMasteries: data.conceptMasteries,
        learningVelocity: data.learningVelocity,
        diagnosticGaps: data.diagnosticGaps,
        readyForCredential: data.readyForCredential,
      };
    }

    throw new ForbiddenException('Unauthorized access context for adolescent learner profile');
  }
}
```

---

## 4. Zero-PII Credential Verification Boundary

When a credential is shared externally (e.g., college application, scholarship verification, digital resume):
- **Verification Endpoint**: `GET /api/v1/credentials/verify/:verification_token_hash`
- **Strictly Prohibited Fields**:
  - `name`, `studentname`, `firstname`, `lastname`
  - `email`, `phone`, `phonenumber`
  - `address`, `postal_code`, `city`
  - `aadhaar`, `ssn`, `national_id`
  - `dob`, `birthdate`, `age`
  - `school_student_id`, `roll_number`
- **Permitted Fields**:
  - `studentDid` (Pseudonymized hash: `did:youva:student:3a7f...`)
  - `competencyCode` (`MATH-G10-QUAD-01`)
  - `achievementName` ("Grade 10 Quadratic Equations & Polynomials")
  - `issuer` (`did:youva:issuer:delhi-public-school`)
  - `issuedAt` (ISO-8601 Timestamp)
  - `proof` (HMAC-SHA256 signature)
  - `evidenceMetrics` (BKT mastery probability, questions answered, verified practice duration)

---

## 5. Verified Parental Consent (VPC) Architecture

1. **Parent Identity Verification**:
   - Parent mobile number or email authenticated via a Cryptographic 6-digit One-Time Password (OTP) with 5-minute expiry.
   - Cryptographic timestamp and audit trail stored in immutable append-only log with HMAC-SHA256 chain.
2. **Consent Lifecycle**:
   - **Grant**: Parent authorizes access to Grade 10 CBSE Math pilot curriculum.
   - **Withdrawal**: At any time, parent can trigger immediate revocation via SMS/web portal. Upon revocation:
     - Learning sessions are halted immediately.
     - Student profile is marked `SUSPENDED_CONSENT_WITHDRAWN`.
     - 30-day retention grace period commences before automated cryptographic shredding.
3. **Data Localization**: All data resides strictly in Indian data centers (Mumbai / Hyderabad AWS/Azure instances) in compliance with DPDP localization guidance.
