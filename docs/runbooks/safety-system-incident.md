# Runbook: Safety System Escalation & Child Protection Incident

## 1. Trigger Conditions
- Triggering of `CRITICAL` safety escalation (self-harm, exploitation, violence, severe harassment).
- Unhandled spike in safety escalation queue (> 25 unresolved high-priority escalations).
- Safety moderator detector failure or circuit open.

## 2. Severity Classification
- **SEV-0**: Safety escalation circuit fails open or un-moderated AI interactions reaching young learners.
- **SEV-1**: Active unaddressed critical child safety flag older than 15 minutes.

## 3. Non-Negotiable Human-Control Invariants
- **AI Cannot Resolve Safety**: Automated AI agents CANNOT resolve, downgrade, or dismiss safety escalations. ONLY verified human safety reviewers or authorized teachers can close safety cases.
- **Immediate Containment**: When a critical safety event is detected, the learner's interactive AI session is immediately locked to safe, supervised pre-approved content.
- **Immutable Audit Trail**: Every escalation event, assigned reviewer, resolution note, and timestamp is stored with cryptographic forward chaining.

## 4. Response Protocol
1. **Engage On-Call Safety Reviewer**:
   - Alert dispatched to human operations team via PagerDuty / priority webhook.
2. **Access Safety Incident Console**:
   - Navigate to `/admin/safety` or `/safety-review`.
   - Filter by `status = OPEN` and `severity = CRITICAL`.
3. **Assess & Contain**:
   - Review trigger transcript and learner context.
   - If emergency situation: contact designated institutional child safety officer and notify registered guardian according to jurisdiction requirements (COPPA / GDPR-K).
4. **Resolution & Sign-off**:
   - Record resolution rationale, safety actions taken, and human operator ID.
   - Authorize student unlock only after pedagogical clearance.
5. **Verify Safety Subsystem Health**:
   ```bash
   curl -X GET http://localhost:4000/api/synthetic/probe/SYN-009
   ```
