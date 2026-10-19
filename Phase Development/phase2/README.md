# YOUVA-EdAI — Phase 2: Safety & Trust Hardening Engine

This package implements the core safety, statutory compliance, and trust-hardening infrastructure required by the Digital Personal Data Protection (DPDP) Act 2023 (Section 9) and the Protection of Children from Sexual Offences (POCSO) Act.

---

## 1. Architectural Components

```
phase2/
├── schemas/
│   ├── consent.schema.json            # JSON Schema for Verifiable Parental Consent (VPC)
│   ├── safety_escalation.schema.json  # JSON Schema for child distress & safety incidents
│   └── audit_ledger.schema.json       # JSON Schema for HMAC-SHA256 chained audit entries
├── models/
│   ├── __init__.py
│   ├── consent_manager.py             # VPC state machine, OTP verification, 24h purge SLA
│   ├── safety_escalator.py            # Dual-channel dispatcher, distress triggers, AI restriction
│   └── audit_ledger.py                # HMAC-SHA256 forward-chained tamper-evident ledger
├── scripts/
│   ├── run_safety_audit.py            # Interactive end-to-end security & safety audit simulator
│   └── validate_phase2_gate.py        # Master Phase 2 exit gate validator
├── tests/
│   ├── __init__.py
│   ├── test_consent_manager.py        # VPC, OTP, fail-closed gating, revocation & purge tests
│   ├── test_safety_escalator.py       # Distress triggers, dual-channel dispatch, AI restriction tests
│   ├── test_audit_ledger.py           # HMAC chain verification, tamper detection tests
│   └── test_phase2_e2e.py             # Exit gate and simulator execution tests
└── README.md
```

---

## 2. Core Non-Negotiable Invariants

1. **Fail-Closed Learning Gating**:
   - `ConsentManager.is_practice_permitted(student_id)` strictly blocks practice sessions until active, verified parental consent (`LEARNING_SERVICE`) has been confirmed via OTP or government ID proof.
2. **Consent Revocation & 24h Purge SLA**:
   - Immediate invalidation of all active student sessions upon consent revocation.
   - Automated scheduling of cryptographic data purge within 24 hours.
   - PII zeroization: names, phone numbers, and emails are cryptographically masked/deleted per statutory mandate.
3. **Dual-Channel Child Safety Dispatch**:
   - Automated regex and contextual trigger detection for self-harm, child abuse, cyberbullying, and sexual harassment.
   - For `HIGH` and `CRITICAL` severity incidents, notifications are dispatched across at least two distinct channels (SMS, Email, In-App Webhook) to human safeguarding roles.
4. **AI Cannot Close Alone**:
   - Automated bots, AI mentors, or background systems attempting to resolve a safety incident are rejected with `SafetyGovernanceViolation`.
   - Resolution strictly requires an authenticated human counselor, educator, or safeguarding officer with mandatory written rationale and digital signature.
5. **Tamper-Evident HMAC-SHA256 Audit Ledger**:
   - Every privileged action is cryptographically forward-chained:
     $$H_n = \text{HMAC-SHA256}(K, n \parallel \text{eventId} \parallel \text{timestamp} \parallel \text{actor} \parallel \text{action} \parallel \text{resource} \parallel \text{outcome} \parallel \text{metadata} \parallel H_{n-1})$$
   - Modifying, deleting, or reordering any ledger entry breaks verification and pinpoints the exact corrupted sequence number.

---

## 3. Verification & Execution

### Running the Exit Gate
```powershell
python phase2/scripts/validate_phase2_gate.py
```

### Running the Interactive Simulation
```powershell
python phase2/scripts/run_safety_audit.py
```

### Running Automated Pytest Suite
```powershell
pytest phase2/tests -v
```
