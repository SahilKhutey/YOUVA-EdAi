"""
YOUVA-EdAI — Phase 2: Safety & Trust Hardening Interactive Simulator.
Demonstrates:
1. Verifiable Parental Consent (VPC) OTP workflow.
2. Fail-closed practice session authorization.
3. Automated child distress trigger detection & dual-channel dispatch.
4. "AI cannot close alone" human-authorization invariant enforcement.
5. Consent revocation, session invalidation, and 24h cryptographic data purge.
6. Cryptographic HMAC-SHA256 audit ledger with tamper detection.
"""

from pathlib import Path
import sys

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
sys.path.insert(0, str(ROOT))

from phase2.models.consent_manager import ConsentManager, ConsentType, VerificationMethod
from phase2.models.safety_escalator import (
    SafetyEscalator,
    SafetyCategory,
    SafetySeverity,
    SafetyGovernanceViolation,
)
from phase2.models.audit_ledger import AuditLedger


def run_simulation():
    print("=" * 70)
    print("YOUVA-EdAI — PHASE 2 SAFETY & TRUST HARDENING AUDIT SIMULATION")
    print("=" * 70)

    consent_mgr = ConsentManager()
    safety_escalator = SafetyEscalator()
    audit_ledger = AuditLedger()

    parent_id = "parent-delhi-001"
    student_id = "student-delhi-001"

    # Step 0: Register Student
    consent_mgr.register_student(
        student_id=student_id,
        name="Aarav Sharma",
        email="aarav.sharma@dpsrkp.edu.in",
        grade="Grade 8",
    )
    audit_ledger.append_event(
        actor_id="admin-1",
        actor_role="ADMIN",
        action="STUDENT_REGISTER",
        resource="Student",
        resource_id=student_id,
    )
    print(f"\n[1] Student Registered: Aarav Sharma ({student_id})")

    # Step 1: Verify Fail-Closed Practice Gating Before Consent
    permitted, reason = consent_mgr.is_practice_permitted(student_id)
    print(f"[2] Practice Gate Before Consent: permitted={permitted}, reason={reason}")
    assert not permitted, "Practice must fail closed before parental consent is verified!"

    try:
        consent_mgr.start_learning_session(student_id, "session-101")
        print("    ERROR: Learning session started without consent!")
        sys.exit(1)
    except PermissionError as e:
        print(f"    Expected fail-closed block verified: {e}")

    # Step 2: Request & Verify OTP for Verifiable Parental Consent
    otp = consent_mgr.request_consent_otp(
        parent_id=parent_id,
        student_id=student_id,
        consent_type=ConsentType.LEARNING_SERVICE,
        channel=VerificationMethod.OTP_SMS,
    )
    print(f"\n[3] Parent OTP Requested via SMS. Generated OTP: {otp}")

    consent_record = consent_mgr.verify_otp_and_grant(
        parent_id=parent_id,
        student_id=student_id,
        consent_type=ConsentType.LEARNING_SERVICE,
        otp_input=otp,
        channel=VerificationMethod.OTP_SMS,
    )
    print(f"    Consent Verified! Status={consent_record.status.value}, Evidence={consent_record.evidence_token[:20]}...")
    audit_ledger.append_event(
        actor_id=parent_id,
        actor_role="PARENT",
        action="CONSENT_VERIFY_GRANT",
        resource="ConsentRecord",
        resource_id=consent_record.consent_id,
        metadata={"consentType": "LEARNING_SERVICE", "method": "OTP_SMS"},
    )

    # Step 3: Verify Practice Gate Now Open
    permitted, reason = consent_mgr.is_practice_permitted(student_id)
    print(f"[4] Practice Gate After VPC: permitted={permitted}, reason={reason}")
    assert permitted, "Practice must be permitted after consent verified!"
    consent_mgr.start_learning_session(student_id, "session-101")
    print("    Learning session 'session-101' started successfully.")

    # Step 4: Proactive Child Safety Monitoring & Dual-Channel Dispatch
    interaction_text = "I feel so hopeless, I want to cut myself and end my life."
    detection = safety_escalator.detect_triggers(interaction_text)
    assert detection is not None, "Self-harm trigger must be detected!"
    category, severity, confidence, snippet = detection
    print(f"\n[5] Safety Trigger Detected: Category={category.value}, Severity={severity.value}, Confidence={confidence}")

    incident = safety_escalator.report_incident(
        student_id=student_id,
        category=category,
        summary=f"Automated trigger: '{snippet}' in learning dialogue",
        severity=severity,
    )
    print(f"    Incident Created: ID={incident.incident_id}, Status={incident.status.value}")
    print(f"    Dual-Channel Dispatch Executed: {len(incident.dispatch_log)} channels notified:")
    for d in incident.dispatch_log:
        print(f"      - Channel: {d.channel.value:15} | Recipient: {d.recipient_role:20} | Status: {d.status}")

    audit_ledger.append_event(
        actor_id="AI_INTERACTION_MONITOR",
        actor_role="SYSTEM",
        action="SAFETY_ESCALATION_DISPATCH",
        resource="SafetyEscalation",
        resource_id=incident.incident_id,
        outcome="ESCALATED",
        metadata={"category": category.value, "severity": severity.value},
    )

    # Step 5: Test Invariant — AI Cannot Close Safety Incident
    print("\n[6] Testing Governance Invariant: AI Cannot Close Alone...")
    try:
        safety_escalator.resolve_incident(
            incident_id=incident.incident_id,
            actor_id="ai-tutor-agent-4",
            actor_role="AI",
            actor_name="Youva AI Mentor",
            rationale="Automated triage classified as false alarm",
            signature="ai-auto-sig-1234567890",
        )
        print("    CRITICAL VIOLATION: AI was allowed to resolve a safety incident!")
        sys.exit(1)
    except SafetyGovernanceViolation as e:
        print(f"    PASS: AI closure strictly blocked: {e}")

    # Step 6: Legitimate Human Resolution by School Counselor
    resolved_inc = safety_escalator.resolve_incident(
        incident_id=incident.incident_id,
        actor_id="counselor-dps-01",
        actor_role="COUNSELOR",
        actor_name="Dr. Sunita Sen (Lead Pastoral Counselor)",
        rationale="Spoke directly with student and guardian; pastoral check-in schedule established.",
        signature="ed-sig-sha256-counselor-dpsrkp-2026-auth",
    )
    print(f"    Human Counselor Resolution Approved! Status={resolved_inc.status.value}")
    audit_ledger.append_event(
        actor_id="counselor-dps-01",
        actor_role="COUNSELOR",
        action="SAFETY_INCIDENT_RESOLVE",
        resource="SafetyEscalation",
        resource_id=incident.incident_id,
        outcome="SUCCESS",
        metadata={"rationale": resolved_inc.resolution.rationale},
    )

    # Step 7: Consent Revocation & 24h Purge Workflow
    print("\n[7] Testing Consent Revocation & 24h Purge SLA...")
    revoked = consent_mgr.revoke_consent(
        parent_id=parent_id,
        student_id=student_id,
        consent_type=ConsentType.LEARNING_SERVICE,
        purge_delay_hours=24,
    )
    print(f"    Consent Revoked. Status={revoked.status.value}, Purge Scheduled At: {revoked.purge_scheduled_at}")
    print(f"    Active Sessions Terminated: {revoked.metadata.get('terminated_active_sessions')}")

    # Fail-closed check after revocation
    permitted, reason = consent_mgr.is_practice_permitted(student_id)
    print(f"    Practice Gate After Revocation: permitted={permitted}, reason={reason}")
    assert not permitted, "Practice must fail closed immediately upon revocation!"

    # Execute cryptographic purge
    purge_result = consent_mgr.execute_scheduled_purge(student_id, force=True)
    print(f"    Cryptographic Purge Executed: {purge_result['status']}")
    print(f"    PII Zeroization Confirmed: {consent_mgr.student_pii[student_id]}")
    audit_ledger.append_event(
        actor_id="SYSTEM_PURGE_WORKER",
        actor_role="SYSTEM",
        action="STUDENT_PII_CRYPTOGRAPHIC_PURGE",
        resource="Student",
        resource_id=student_id,
        metadata=purge_result,
    )

    # Step 8: Verify HMAC Audit Ledger Integrity & Tamper Detection
    print("\n[8] Verifying Cryptographic HMAC-SHA256 Audit Ledger...")
    valid, err, seq = audit_ledger.verify_chain_integrity()
    print(f"    Initial Ledger Chain Verification: valid={valid} (Total Entries: {len(audit_ledger.entries)})")
    assert valid, f"Audit ledger chain failed initial validation: {err}"

    # Inject simulated tamper attack
    print("    Injecting simulated tamper: modifying action on entry sequence 2...")
    original_action = audit_ledger.entries[2].action
    audit_ledger.entries[2].action = "MALICIOUS_UNAUTHORIZED_OVERRIDE"

    tamper_valid, tamper_err, tamper_seq = audit_ledger.verify_chain_integrity()
    print(f"    Tamper Detection Result: valid={tamper_valid}, detected_sequence={tamper_seq}")
    print(f"    Tamper Reason: {tamper_err}")
    assert not tamper_valid, "Tampering must be detected by HMAC hash chaining!"
    assert tamper_seq == 2, "Tamper detector must pinpoint exact corrupted sequence!"

    # Restore entry
    audit_ledger.entries[2].action = original_action
    restored_valid, _, _ = audit_ledger.verify_chain_integrity()
    assert restored_valid, "Chain must be valid once repaired!"
    print("    Ledger restored. Integrity verified 100% clean.")

    print("\n" + "=" * 70)
    print("ALL PHASE 2 SAFETY & TRUST CHECKS PASSED CLEANLY")
    print("=" * 70)


if __name__ == "__main__":
    run_simulation()
