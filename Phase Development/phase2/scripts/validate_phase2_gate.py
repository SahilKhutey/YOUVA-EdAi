"""
YOUVA-EdAI — Phase 2 Exit Gate Validator.
Verifies:
1. Verifiable Parental Consent (VPC) Schema & DPDP Act 2023 Compliance.
2. Fail-Closed Learning Session Gate.
3. 24-Hour Cryptographic Data Purge SLA.
4. Child Safety Escalation Trigger List & Dual-Channel Dispatch.
5. Invariant: AI Cannot Close Alone (Strict Human Authorization).
6. Tamper-Evident HMAC-SHA256 Audit Ledger & Tamper Detection.

Exits 0 on success, exits 1 on failure.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
sys.path.insert(0, str(ROOT))

from phase2.models.consent_manager import ConsentManager, ConsentType, VerificationMethod, ConsentStatus
from phase2.models.safety_escalator import (
    SafetyEscalator,
    SafetyCategory,
    SafetySeverity,
    SafetyGovernanceViolation,
)
from phase2.models.audit_ledger import AuditLedger

PHASE1_GATE_SCRIPT = ROOT / "phase1" / "scripts" / "validate_phase1_gate.py"


def run_checks() -> bool:
    print("=" * 65)
    print("YOUVA-EdAI — PHASE 2 EXIT GATE VALIDATION")
    print("=" * 65)
    all_passed = True
    base_dir = Path(__file__).resolve().parent.parent

    # -------------------------------------------------------------
    # Check 0: Phase 1 Gate Prerequisite
    # -------------------------------------------------------------
    print("\n[Check 0/7] Verifying Phase 1 Exit Gate Prerequisite...")
    if not PHASE1_GATE_SCRIPT.exists():
        print(f"  FAILED: Missing Phase 1 gate script at {PHASE1_GATE_SCRIPT}")
        all_passed = False
    else:
        res = subprocess.run([sys.executable, str(PHASE1_GATE_SCRIPT)], capture_output=True, text=True)
        if res.returncode != 0:
            print("  FAILED: Phase 1 exit gate prerequisite failed!")
            print(res.stderr or res.stdout)
            all_passed = False
        else:
            print("  PASS: Phase 1 exit gate prerequisite verified (Core Learning Loop MVP valid)")

    # -------------------------------------------------------------
    # Check 1: Validate Schemas Exist and Parse Cleanly
    # -------------------------------------------------------------
    print("\n[Check 1/7] Validating Phase 2 JSON Schemas...")
    schemas = [
        base_dir / "schemas" / "consent.schema.json",
        base_dir / "schemas" / "safety_escalation.schema.json",
        base_dir / "schemas" / "audit_ledger.schema.json",
    ]
    for s_path in schemas:
        if not s_path.exists():
            print(f"  FAILED: Missing schema {s_path.name}")
            all_passed = False
        else:
            try:
                with open(s_path, "r", encoding="utf-8") as f:
                    json.load(f)
                print(f"  PASS: Schema {s_path.name} valid")
            except Exception as e:
                print(f"  FAILED: Schema {s_path.name} parse error: {e}")
                all_passed = False

    # -------------------------------------------------------------
    # Check 2: Verifiable Parental Consent & Fail-Closed Gating
    # -------------------------------------------------------------
    print("\n[Check 2/7] Verifying VPC State Machine & Fail-Closed Gate...")
    cm = ConsentManager()
    cm.register_student("s-test-1", "Test Student", "test@youva.internal")

    # Before consent -> must be blocked
    permitted, _ = cm.is_practice_permitted("s-test-1")
    if permitted:
        print("  FAILED: Practice permitted without parental consent!")
        all_passed = False
    else:
        print("  PASS: Practice blocked fail-closed when consent missing")

    # OTP workflow
    otp = cm.request_consent_otp("p-test-1", "s-test-1", ConsentType.LEARNING_SERVICE)
    rec = cm.verify_otp_and_grant("p-test-1", "s-test-1", ConsentType.LEARNING_SERVICE, otp)
    if rec.status != ConsentStatus.VERIFIED or not rec.evidence_token:
        print("  FAILED: Consent verification failed to produce verified status or token")
        all_passed = False
    else:
        print(f"  PASS: OTP VPC granted with cryptographic evidence: {rec.evidence_token[:16]}...")

    permitted_after, _ = cm.is_practice_permitted("s-test-1")
    if not permitted_after:
        print("  FAILED: Practice blocked even after valid consent granted")
        all_passed = False
    else:
        print("  PASS: Practice authorized after verified consent")

    # -------------------------------------------------------------
    # Check 3: Consent Revocation & 24h Purge SLA
    # -------------------------------------------------------------
    print("\n[Check 3/7] Verifying Revocation & 24h Cryptographic Purge SLA...")
    revoked = cm.revoke_consent("p-test-1", "s-test-1", ConsentType.LEARNING_SERVICE, purge_delay_hours=24)
    if revoked.status != ConsentStatus.REVOKED or not revoked.purge_scheduled_at:
        print("  FAILED: Revocation failed to transition status or set purge schedule")
        all_passed = False
    else:
        print(f"  PASS: Revocation recorded. Purge scheduled at: {revoked.purge_scheduled_at.isoformat()}")

    # Verify practice blocked immediately upon revocation
    perm_revoked, _ = cm.is_practice_permitted("s-test-1")
    if perm_revoked:
        print("  FAILED: Practice still permitted after revocation!")
        all_passed = False
    else:
        print("  PASS: Practice immediately blocked upon consent revocation")

    # Execute purge
    purge_res = cm.execute_scheduled_purge("s-test-1", force=True)
    if not purge_res.get("piiZeroized") or not cm.student_pii["s-test-1"]["is_anonymized"]:
        print("  FAILED: Student PII was not zeroized during purge!")
        all_passed = False
    else:
        print("  PASS: Student PII zeroized and anonymized per DPDP Act Section 9")

    # -------------------------------------------------------------
    # Check 4: Child Safety Triggers & Dual-Channel Dispatch
    # -------------------------------------------------------------
    print("\n[Check 4/7] Verifying Safety Trigger Coverage & Dual-Channel Dispatch...")
    se = SafetyEscalator()
    sample_text = "I want to kill myself, nobody cares."
    trigger = se.detect_triggers(sample_text)
    if not trigger or trigger[0] != SafetyCategory.SELF_HARM or trigger[1] != SafetySeverity.CRITICAL:
        print(f"  FAILED: Self-harm trigger detection unexpected: {trigger}")
        all_passed = False
    else:
        print(f"  PASS: Self-harm trigger detected (severity={trigger[1].value}, conf={trigger[2]})")

    incident = se.report_incident("s-test-2", trigger[0], "Self-harm detected in chat", severity=trigger[1])
    channels = {d.channel.value for d in incident.dispatch_log}
    if len(channels) < 2:
        print(f"  FAILED: Dual-channel dispatch violated! Notified channels: {channels}")
        all_passed = False
    else:
        print(f"  PASS: Dual-channel dispatch verified: {len(incident.dispatch_log)} channels ({', '.join(sorted(channels))})")

    # -------------------------------------------------------------
    # Check 5: Governance Invariant: AI Cannot Close Alone
    # -------------------------------------------------------------
    print("\n[Check 5/7] Verifying Invariant: AI Cannot Close Safety Incidents...")
    ai_blocked = False
    try:
        se.resolve_incident(
            incident.incident_id,
            actor_id="ai-bot-01",
            actor_role="AI",
            actor_name="AI Bot",
            rationale="Auto-closing false alarm",
            signature="auto-sig-123456789",
        )
    except SafetyGovernanceViolation:
        ai_blocked = True

    if not ai_blocked:
        print("  FAILED: AI successfully closed a safety incident!")
        all_passed = False
    else:
        print("  PASS: AI closure strictly rejected with SafetyGovernanceViolation")

    # Verify authorized human resolution
    human_resolved = se.resolve_incident(
        incident.incident_id,
        actor_id="counselor-01",
        actor_role="COUNSELOR",
        actor_name="Ms. Anita Rao (Counselor)",
        rationale="Spoke directly with student and guardian; counseling session booked.",
        signature="sig-human-counselor-dps-01-verified",
    )
    if human_resolved.status.value != "RESOLVED":
        print(f"  FAILED: Human resolution failed to update status: {human_resolved.status}")
        all_passed = False
    else:
        print("  PASS: Authenticated human counselor authorized resolution")

    # -------------------------------------------------------------
    # Check 6: Tamper-Evident HMAC-SHA256 Audit Ledger
    # -------------------------------------------------------------
    print("\n[Check 6/7] Verifying HMAC Audit Ledger & Tamper Detection...")
    ledger = AuditLedger()
    e0 = ledger.append_event("actor-1", "PARENT", "CONSENT_GRANT", "ConsentRecord", "SUCCESS")
    e1 = ledger.append_event("actor-2", "STUDENT", "PRACTICE_START", "PracticeSession", "SUCCESS")
    e2 = ledger.append_event("actor-3", "COUNSELOR", "INCIDENT_RESOLVE", "SafetyEscalation", "SUCCESS")

    valid, err, seq = ledger.verify_chain_integrity()
    if not valid:
        print(f"  FAILED: Initial ledger chain integrity failed: {err}")
        all_passed = False
    else:
        print(f"  PASS: Clean audit chain verified ({len(ledger.entries)} entries)")

    # Tamper test
    original_action = ledger.entries[1].action
    ledger.entries[1].action = "MALICIOUS_TAMPER"
    tampered_valid, tamper_err, tamper_seq = ledger.verify_chain_integrity()
    ledger.entries[1].action = original_action  # restore

    if tampered_valid or tamper_seq != 1:
        print(f"  FAILED: Ledger failed to detect tampering! valid={tampered_valid}, seq={tamper_seq}")
        all_passed = False
    else:
        print(f"  PASS: Tampering detected at sequence {tamper_seq}: {tamper_err}")

    # -------------------------------------------------------------
    # Gate Verdict
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    if all_passed:
        print("PHASE 2 COMPLETE — SAFETY & TRUST HARDENING VERIFIED")
        print("EXIT GATE PASSED (Code 0)")
        print("=" * 65)
        return True
    else:
        print("PHASE 2 EXIT GATE FAILED")
        print("=" * 65)
        return False


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
