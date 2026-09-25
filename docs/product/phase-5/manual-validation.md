# YOUVA EdAI — Phase 5: Manual Validation & Verification Runbook
## Step-by-Step Operator Procedures for Credential Issuance, Tamper Testing, and Public Verification

---

## 1. Scope & Purpose

This runbook provides human operators, quality assurance engineers, and compliance auditors with exact, reproducible step-by-step procedures to manually validate the Phase 5 High School expansion, Skills Passport W3C VC 2.0 engine, and Zero-PII public verifier.

---

## 2. Test Environment Setup & Prerequisites

```bash
# Navigate to repository root
cd c:\Users\ASUS\Documents\Youva-EdAi\YOUVA-EdAi

# Verify Python 3.12+ and dependencies
python --version
pytest --version

# Run baseline automated verification
python phase5/scripts/validate_phase5_gate.py
```
*Expected Output: `ALL 7 PHASE 5 EXIT CHECKS PASSED.`*

---

## 3. End-to-End Operational Validation Steps

### Step 1: Simulate Student Deliberate Practice & Mastery
Simulate an adolescent learner completing deliberate practice in Grade 10 Quadratic Equations:

```python
from phase5.models.skills_passport import SkillsPassportEngine, AntiGamingRules

engine = SkillsPassportEngine()
student_did = engine.generate_student_did("STUDENT-DPS-10A-042")
print(f"Generated Pseudonymized DID: {student_did}")
# Expected format: did:youva:student:<16-hex-chars> (NO name, email, or school ID)
```

### Step 2: Test Anti-Gaming Gate Rejection (Negative Control)
Attempt to issue a credential before meeting anti-gaming thresholds:

```python
dirty_metrics = {
    "bktMasteryProbability": 0.90,  # High mastery
    "questionsAnswered": 8,          # Fails < 15 threshold
    "timeOnTaskMinutes": 20.0,       # Fails < 45 min threshold
    "independentAccuracy": 0.72      # Fails < 80% threshold
}
teacher_auth = {
    "teacherId": "TCH-DPS-101",
    "role": "Senior Mathematics Faculty",
    "decision": "APPROVED"
}

try:
    engine.create_credential(student_did, "MATH-G10-QUAD-01", "Quad Mastery", "Desc", dirty_metrics, teacher_auth)
except Exception as e:
    print(f"Trapped Anti-Gaming Violation: {e}")
```
*Expected Result: `AntiGamingPolicyViolationError` raised. Credential is NOT minted.*

### Step 3: Test Autonomous AI Issuance Blocking (Hard Invariant)
Attempt to issue a credential where the authorization claims an automated AI role:

```python
valid_metrics = {
    "bktMasteryProbability": 0.91,
    "questionsAnswered": 20,
    "timeOnTaskMinutes": 55.0,
    "independentAccuracy": 0.85
}
ai_auth = {
    "teacherId": "AI-TUTOR-001",
    "role": "ai_agent", # FORBIDDEN ROLE
    "decision": "APPROVED"
}

try:
    engine.create_credential(student_did, "MATH-G10-QUAD-01", "Quad Mastery", "Desc", valid_metrics, ai_auth)
except Exception as e:
    print(f"Trapped Autonomous AI Issuance: {e}")
```
*Expected Result: `HumanAuthorizationRequiredError` raised. Autonomous issuance fail-closed blocked.*

### Step 4: Legitimate Teacher Sign-Off & Minting
Execute genuine human teacher authorization:

```python
human_auth = {
    "teacherId": "staff:dps:math:dr-anita-deshmukh",
    "name": "Dr. Anita Deshmukh",
    "role": "Senior Mathematics Faculty",
    "decision": "APPROVED",
    "authorizedAt": "2026-09-08T10:14:00Z"
}

credential = engine.create_credential(
    student_did=student_did,
    competency_code="MATH-G10-QUAD-01",
    achievement_name="Grade 10 Quadratic Equations & Polynomials Mastery",
    achievement_description="Demonstrated mastery of standard forms, discriminant evaluation, and factorisation.",
    metrics=valid_metrics,
    teacher_authorization=human_auth
)

print(f"Credential Minted: {credential['id']}")
print(f"Proof Value: {credential['proof']['proofValue'][:24]}...")
```
*Expected Result: W3C VC 2.0 object created with valid HMAC-SHA256 signature.*

### Step 5: Verify Cryptographic Proof & Zero-PII Response
Validate the credential through the verifier:

```python
# 1. Verify cryptographic validity
is_valid = engine.verify_credential(credential)
assert is_valid == True, "Verification failed!"
print("Cryptographic verification: VALID")

# 2. Verify Zero-PII in public verification endpoint response
public_response = engine.generate_public_verification_response(credential)
print(f"Public Response Payload: {json.dumps(public_response, indent=2)}")

# Assert zero forbidden PII fields in response
forbidden_keys = {"name", "studentname", "email", "phone", "aadhaar", "dob"}
assert not any(k in public_response for k in forbidden_keys)
print("Zero-PII Audit: STRICTLY PASSED")
```

### Step 6: Tamper Test (Security Attack Simulation)
Simulate an attacker altering the credential score:

```python
tampered_cred = json.loads(json.dumps(credential))
# Attacker alters BKT mastery probability from 0.91 to 0.99
tampered_cred["evidence"][0]["metrics"]["bktMasteryProbability"] = 0.99

try:
    engine.verify_credential(tampered_cred)
except Exception as e:
    print(f"Tamper Detected: {e}")
```
*Expected Result: `CredentialIntegrityError` raised instantly. Proof signature mismatch.*

---

## 4. Manual Validation Summary Checklist

- [x] Student DID is fully pseudonymized (`did:youva:student:...`).
- [x] Anti-gaming policy halts issuance on sub-threshold metrics.
- [x] AI agents cannot authorize credentials under any circumstance.
- [x] Valid teacher sign-off issues compliant W3C VC 2.0 credential.
- [x] Public verification API returns zero personal identifiers.
- [x] Any payload modification invalidates cryptographic proof.
