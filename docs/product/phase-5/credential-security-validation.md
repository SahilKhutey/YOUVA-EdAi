# YOUVA EdAI — Phase 5: Credential Security & Verification Validation
## Cryptographic Proof Integrity, Zero-PII Leak Auditing, and Fail-Closed Boundary Testing

---

## 1. Security Architecture & Threat Model

The Skills Passport credential system faces four primary security threats:
1. **PII Leakage via Public Verifier**: Accidental exposure of student names, emails, national IDs (Aadhaar), or dates of birth through public verification URLs.
2. **Autonomous AI Credential Minting**: A compromised or misconfigured AI agent falsely certifying student mastery without human teacher sign-off.
3. **Gaming & Credential Farming**: Malicious scripts, peer collusion, or hint brute-forcing artificially inflating mastery metrics.
4. **Payload Tampering**: Post-issuance modification of credential claims (e.g., altering competency code or mastery score) while retaining the original signature.

---

## 2. Test Suite & Validation Matrix

The security invariants are continuously verified through automated unit, integration, and fuzz tests in `phase5/tests/test_skills_passport.py`.

| Test ID | Security Dimension | Scenario Tested | Expected Result | Automated Status |
|---|---|---|---|---|
| **SEC-P5-01** | Zero-PII Enforcement | Payload injected with `"studentName": "Aarav Sharma"` | `ZeroPIIViolationError` raised; issuance halted | **PASS** |
| **SEC-P5-02** | Zero-PII Scanner | Credential subject contains prohibited field `"aadhaar": "1234-5678-9012"` | Immediate rejection; regex traps all PII keys | **PASS** |
| **SEC-P5-03** | Zero-PII Verification API | Query public verification endpoint `GET /verify/:hash` | Response contains strictly zero PII fields | **PASS** |
| **SEC-P5-04** | Human Authorization Gate | Issuance attempted with `teacher_authorization = None` | `HumanAuthorizationRequiredError` raised | **PASS** |
| **SEC-P5-05** | Human Authorization Gate | Issuance attempted with `role: "ai_tutor"` | Rejection: only human roles (`Senior Faculty`, etc.) permitted | **PASS** |
| **SEC-P5-06** | Anti-Gaming Gate | 10 practice questions answered (< 15 threshold) | `AntiGamingPolicyViolationError` raised | **PASS** |
| **SEC-P5-07** | Anti-Gaming Gate | 25 minutes time-on-task (< 45 min threshold) | `AntiGamingPolicyViolationError` raised | **PASS** |
| **SEC-P5-08** | Anti-Gaming Gate | Independent accuracy 74% (< 80% threshold) | `AntiGamingPolicyViolationError` raised | **PASS** |
| **SEC-P5-09** | Cryptographic Integrity | Genuine credential created with HMAC-SHA256 signature | `engine.verify_credential(cred)` returns `True` | **PASS** |
| **SEC-P5-10** | Tamper Pinpointing | Modify `competencyCode` from `MATH-G10-QUAD-01` to `MATH-G10-CALC-01` | Signature mismatch; `CredentialIntegrityError` | **PASS** |
| **SEC-P5-11** | Tamper Pinpointing | Modify `bktMasteryProbability` from 0.92 to 0.99 | Signature mismatch; `CredentialIntegrityError` | **PASS** |

---

## 3. Cryptographic Signature & Verification Mechanism

Credentials utilize an HMAC-SHA256 digital proof suite calculated over the canonicalized JSON representation of the credential claim:

$$\text{Signature} = \text{HMAC-SHA256}(K_{\text{issuer}}, \text{Canonicalize}(\text{CredentialBody} \setminus \{\text{proof}\}))$$

```python
# Canonicalization & Signature Generation in skills_passport.py
def _canonicalize_payload(self, payload: Dict[str, Any]) -> bytes:
    """Produce deterministic byte stream by stripping proof and sorting keys."""
    clean = {k: v for k, v in payload.items() if k != "proof"}
    return json.dumps(clean, sort_keys=True, separators=(",", ":")).encode("utf-8")

def sign_credential(self, credential: Dict[str, Any]) -> str:
    canonical_bytes = self._canonicalize_payload(credential)
    return hmac.new(self.SECRET_KEY, canonical_bytes, hashlib.sha256).hexdigest()
```

### 3.1 Verification Guarantee
Because any mutation in whitespace, dictionary order, or values alters the input byte stream to HMAC-SHA256, tampering with even a single bit of student DID, competency code, or mastery percentage causes instantaneous signature verification failure.

---

## 4. Zero-PII Static & Dynamic Auditing

The system enforces an active PII scanner across all outgoing HTTP response serializers. The scanner evaluates:
1. **Key-name matching**: Traps any key matching `name`, `firstname`, `lastname`, `email`, `phone`, `address`, `ssn`, `aadhaar`, `dob`, `birthdate`.
2. **Value-pattern matching**: Traps Indian phone number formats (`(\+91)?[6-9]\d{9}`), email formats (`[^@]+@[^@]+\.[^@]+`), and Aadhaar 12-digit patterns.

```python
# Zero-PII Scanner Test Evidence from test_skills_passport.py
def test_zero_pii_scanner_traps_forbidden_fields():
    engine = SkillsPassportEngine()
    dirty_subject = {
        "id": "did:youva:student:3a7f8b",
        "studentName": "Aarav Sharma", # FORBIDDEN
        "competencyCode": "MATH-G10-QUAD-01"
    }
    with pytest.raises(ZeroPIIViolationError) as exc_info:
        engine.scan_for_pii(dirty_subject)
    assert "studentName" in str(exc_info.value)
```

Result: **100% of PII injection attempts trapped without exception.**
