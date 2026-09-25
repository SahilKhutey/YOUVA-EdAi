# YOUVA EdAI — Phase 8: Permanent Human-Only Invariants (Prohibited AI Actions)
## Constitutional Boundaries Gating Consequential Educational, Legal, and Safety Authority

---

## 1. Executive Summary

YOUVA EdAI establishes an inviolable architectural boundary: **AI systems must never possess autonomous authority over consequential life, legal, educational, or safety decisions.**

No machine learning model, autonomous agent, or heuristic algorithm may execute, override, or finalize any action classified under the **Permanent Human-Only Invariant List**.

---

## 2. Inviolable Prohibited Actions Registry

The following six operations are strictly barred from autonomous invocation. Any call to these actions by an automated identity raises `HumanAuthorizationRequiredError` and aborts immediately.

```python
PROHIBITED_HUMAN_ONLY_ACTIONS: Set[AgentAction] = {
    AgentAction.MODIFY_MASTERY,
    AgentAction.MODIFY_CONSENT,
    AgentAction.MODIFY_ROLE,
    AgentAction.CLOSE_SAFETY_CASE,
    AgentAction.DELETE_LEARNER,
    AgentAction.CHANGE_BILLING,
}
```

### Detailed Rationale & Governance Guardrails

### 1. `MODIFY_MASTERY` (Mastery Certification & Grade Issuance)
- **Prohibition:** AI cannot autonomously certify official curricular mastery, graduate a student from a course, alter standardized transcript records, or issue credentials.
- **Rationale:** Pedagogical assessment has direct implications for student progression, academic tracking, and institutional standing. Only certified educators have legal and ethical standing to certify competence.
- **Permitted AI Action:** AI may calculate internal BKT (Bayesian Knowledge Tracing) values or recommend readiness flags (`OBSERVE` / `RECOMMEND`). Final certification requires teacher signature.

### 2. `MODIFY_CONSENT` (Parental Consent & DPDP Rights)
- **Prohibition:** AI cannot grant, modify, renew, or infer parental consent under India’s Digital Personal Data Protection (DPDP) Act 2023 or COPPA/GDPR frameworks.
- **Rationale:** Processing of children's data under DPDP Act §9 requires verifiable parental consent. Algorithmic inference of consent is legally void and exposes the platform to statutory penalties.
- **Enforcement:** Changes to consent records must originate from verified guardian credentials using Aadhaar OTP or Government ID verification.

### 3. `MODIFY_ROLE` (RBAC Privileges & Role Elevation)
- **Prohibition:** AI agents cannot elevate user roles, assign teacher permissions, generate tenant administrator tokens, or modify access control lists.
- **Rationale:** Prevents privilege escalation attacks through prompt injection, context tampering, or autonomous drift.

### 4. `CLOSE_SAFETY_CASE` (Child Protection & Safety Escalation Disposition)
- **Prohibition:** AI cannot resolve, dismiss, downgrade, or close a student safety incident, distress signal, or safeguarding report.
- **Rationale:** Automated dismissal of safety concerns risks ignoring critical child distress, self-harm signals, or harassment.
- **Enforcement:** AI may flag potential safety risks into the triage queue. Only a certified Child Safety Officer (CSO) can review human context and formally close a safety case.

### 5. `DELETE_LEARNER` (Account Deletion & Data Expungement)
- **Prohibition:** AI cannot purge student profiles, delete learning histories, or execute data erasure commands.
- **Rationale:** Irreversible data deletion must comply with strict statutory retention requirements (audit trails) and must be explicitly initiated by the data principal (parent/guardian).

### 6. `CHANGE_BILLING` (Financial & Subscription Modifications)
- **Prohibition:** AI cannot alter tenant contract pricing, debit institutional bank accounts, upgrade subscription tiers, or issue financial credits.
- **Rationale:** Commercial commitments require binding corporate and fiduciary human authorization.

---

## 3. Failure Mode & Defensive Containment

When an AI actor attempts any prohibited operation:
1. **Instant Rejection:** The `AutonomyGovernanceEngine` halts evaluation and raises `HumanAuthorizationRequiredError`.
2. **Audit Logging:** An immutable record with SHA-256 hash is recorded in `governance_ledger.py`.
3. **Sandbox Lockdown:** The invoking agent session is marked `SUSPENDED` pending review.
4. **Zero State Mutation:** Database write pipelines reject the transaction at the database constraint level.
