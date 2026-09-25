# YOUVA EdAI — Phase 6: Early Learner Manual E2E Validation Runbook
## End-to-End Golden Path Walkthrough and Deliberate Adversarial Failure Drills

---

## 1. Scope & Execution Purpose

This runbook provides Quality Assurance engineers, compliance auditors, and field researchers with reproducible step-by-step procedures to validate the complete Early Learner learning loop, parent co-pilot supervision, and adversarial fail-closed boundaries.

---

## 2. Part 1: The Golden Path Validation Walkthrough

```
[1. Guardian Consent] ──> [2. Child Session Launch] ──> [3. Guided Activity] 
                                                                │
                                                                ▼
[6. Next Activity] <── [5. Safe Audio Feedback] <── [4. Voice/Tap Response]
        │
        ▼
[7. 15-Minute Timeout] ──> [8. Parent Digest] ──> [9. Teacher Visibility] ──> [10. Audit Chain]
```

### Step 1: Verified Parental Consent (VPC)
- **Action**: Parent enters phone/email on mobile enrollment page.
- **Verification**: 6-digit OTP delivered; parent enters code within 5 minutes.
- **Assertion**: HMAC-signed consent log recorded in database; child profile activated with `tier: "EARLY_LEARNER"`, `scopeBand: "EARLY_LEARNER_V1"`.

### Step 2: Child Session Launch & Pairing
- **Action**: Child selects avatar icon on tablet; companion app on parent mobile establishes WebSocket session pairing.
- **Assertion**: Parent companion status transitions to `ACTIVE (Mode: PARENT_ASSISTED)`.

### Step 3: Spoken Prompt Delivery
- **Action**: Interface plays pre-recorded audio: *"Can you tap 3 apples?"*
- **Assertion**: Screen displays 3 calibrated touch options; text on screen is exactly 5 words; live transcript mirrors prompt to parent companion.

### Step 4: Touch/Voice Response & BKT Update
- **Action**: Child taps correct option (3 apples).
- **Assertion**: Soft pleasant chime plays; star sparkle animation appears; BKT probability updates for competency `NUM-EARLY-01`; no raw BKT scores shown to child.

### Step 5: Screen-Time Cap & Non-Surveillance Digest
- **Action**: Fast-forward session clock to $t = 15.0\text{ min}$.
- **Assertion**: Screen locks automatically; cheerful bedtime star appears; parent companion receives `ParentDigest`:
  > *"Practiced Number Sense. Completed 4 activities together. Enjoyed working with gentle hints on one activity."*
  *(Zero occurrences of percentages or BKT probability).*

---

## 3. Part 2: Deliberate Adversarial Failure Drills

To prove the system fails safely under stress, the following 11 negative conditions are manually injected:

| Drill ID | Injected Failure / Attack | Expected System Reaction | Result |
|---|---|---|---|
| **DRL-01** | Ambiguous Mumbled Voice | STT confidence $< 0.85$; routes to review queue; static audio plays | **FAIL-SAFE** |
| **DRL-02** | Invalid / Incoherent Input | System does NOT guess via LLM; offers 1 gentle retry hint | **FAIL-SAFE** |
| **DRL-03** | Unsafe / Inappropriate Topic | Child asks about violence; keyword trap trips; parent notified | **FAIL-SAFE** |
| **DRL-04** | Missing Guardian Consent | Child attempts to launch practice without VPC; access blocked | **FAIL-SAFE** |
| **DRL-05** | Expired Consent Session | Session token expired; graceful logout to home screen | **FAIL-SAFE** |
| **DRL-06** | Generative Chat Attempt | Injected POST to `/api/v1/ai/chat`; returns `403 Forbidden` | **FAIL-SAFE** |
| **DRL-07** | Unauthorized Parent Access | Parent B tries to view Parent A's live stream; rejected by RBAC | **FAIL-SAFE** |
| **DRL-08** | Unauthorized Teacher Action| Teacher tries to assign High School calculus; rejected by tier | **FAIL-SAFE** |
| **DRL-09** | Draft Content Injection | Activity pool contains `status: "DRAFT"` item; runtime filters it out | **FAIL-SAFE** |
| **DRL-10** | Retired Content Access | Direct URL to `status: "RETIRED"` item; returns `404 Not Found` | **FAIL-SAFE** |
| **DRL-11** | Review Queue Disconnected | RabbitMQ review worker killed; item logged to local disk emergency log | **FAIL-SAFE** |
