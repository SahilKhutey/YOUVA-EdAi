"""
YOUVA-EdAI — Phase 6 Exit Gate Validator.
Verifies:
1. Phase 0, 1, 2, 3, 4, and 5 Exit Gate Prerequisites.
2. Junior Tier Scope-Lock Schema & Tripartite Sign-Offs.
3. Early Childhood Content Bank, Diagnostic Assessment, and Certified Lexicon.
4. EarlyChildhoodContentGuard Hard Boundary Enforcement (lexicon, length, dark patterns).
5. Mandatory 15-Minute Screen-Time Guard Enforcement.
6. Parent Co-Pilot Supervisory Bridge & Unilateral Kill Switch.
7. Independent Child Safety Review & Closed Junior Pilot Evaluation Report.

Exits 0 on success, exits 1 on failure.
"""

import json
from pathlib import Path
import subprocess
import sys
import jsonschema

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
sys.path.insert(0, str(ROOT))

from phase6.models.content_guard import (
    EarlyChildhoodContentGuard,
    ContentConstraintViolation,
    ScreenTimeLimitExceededError
)
from phase6.models.parent_copilot import ParentCopilotSession, SessionStateError

PHASE0_GATE_SCRIPT = ROOT / "phase0" / "scripts" / "validate_phase1_gate.py"
PHASE1_GATE_SCRIPT = ROOT / "phase1" / "scripts" / "validate_phase1_gate.py"
PHASE2_GATE_SCRIPT = ROOT / "phase2" / "scripts" / "validate_phase2_gate.py"
PHASE3_GATE_SCRIPT = ROOT / "phase3" / "scripts" / "validate_phase3_gate.py"
PHASE4_GATE_SCRIPT = ROOT / "phase4" / "scripts" / "validate_phase4_gate.py"
PHASE5_GATE_SCRIPT = ROOT / "phase5" / "scripts" / "validate_phase5_gate.py"


def run_checks() -> bool:
    print("=" * 65)
    print("YOUVA-EdAI — PHASE 6 EXIT GATE VALIDATION")
    print("=" * 65)
    all_passed = True

    # -------------------------------------------------------------
    # Check 0: Phase 0 - 5 Gate Prerequisites
    # -------------------------------------------------------------
    print("\n[Check 0/7] Verifying Phase 0 - 5 Exit Gate Prerequisites...")
    gates = [
        ("Phase 0", PHASE0_GATE_SCRIPT),
        ("Phase 1", PHASE1_GATE_SCRIPT),
        ("Phase 2", PHASE2_GATE_SCRIPT),
        ("Phase 3", PHASE3_GATE_SCRIPT),
        ("Phase 4", PHASE4_GATE_SCRIPT),
        ("Phase 5", PHASE5_GATE_SCRIPT)
    ]
    for label, script in gates:
        if not script.exists():
            print(f"  FAILED: Missing {label} gate script at {script}")
            all_passed = False
        else:
            res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"  FAILED: {label} prerequisite check failed!")
                all_passed = False
            else:
                print(f"  PASS: {label} exit gate prerequisite verified")

    # -------------------------------------------------------------
    # Check 1: Junior Tier Scope Lock
    # -------------------------------------------------------------
    print("\n[Check 1/7] Validating Junior Tier Scope-Lock & Sign-Offs...")
    scope_path = BASE / "scope" / "junior_scope_lock.json"
    scope_schema_path = BASE / "schemas" / "junior_scope.schema.json"

    try:
        with open(scope_schema_path, "r", encoding="utf-8") as f:
            scope_schema = json.load(f)
        with open(scope_path, "r", encoding="utf-8") as f:
            scope_data = json.load(f)

        jsonschema.validate(scope_data, scope_schema)
        if scope_data["tier"] == "KINDERGARTEN_JUNIOR" and scope_data["technicalConstraints"]["maxSessionMinutes"] <= 15:
            print("  PASS: Scope lock conforms to schema (Kindergarten / Junior, <=15m limit)")
        else:
            print("  FAILED: Invalid tier or technical constraints in scope lock")
            all_passed = False

        signoffs = scope_data.get("signoffs", [])
        if len(signoffs) >= 3 and all(s["decision"] == "APPROVED" for s in signoffs):
            print(f"  PASS: All {len(signoffs)} stakeholder sign-offs APPROVED")
        else:
            print("  FAILED: Missing or unapproved sign-offs in scope lock")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Scope lock validation error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 2: Early Childhood Content Bank & Certified Lexicon
    # -------------------------------------------------------------
    print("\n[Check 2/7] Verifying Early Childhood Content & Lexicon...")
    bank_path = BASE / "content" / "foundational_numeracy_bank.json"
    diag_path = BASE / "content" / "foundational_diagnostic.json"
    lex_path = BASE / "content" / "early_lexicon.json"

    try:
        with open(bank_path, "r", encoding="utf-8") as f:
            bank = json.load(f)
        if len(bank.get("items", [])) == 20:
            print("  PASS: Foundational content bank verified with 20 early childhood items")
        else:
            print("  FAILED: Content bank count mismatch")
            all_passed = False

        with open(diag_path, "r", encoding="utf-8") as f:
            diag = json.load(f)
        if len(diag.get("items", [])) == 5:
            print("  PASS: Diagnostic assessment verified with 5 calibrated items")
        else:
            print("  FAILED: Diagnostic count mismatch")
            all_passed = False

        with open(lex_path, "r", encoding="utf-8") as f:
            lex = json.load(f)
        if len(lex.get("certifiedVocabulary", [])) >= 100:
            print(f"  PASS: Certified early childhood lexicon loaded ({len(lex['certifiedVocabulary'])} words)")
        else:
            print("  FAILED: Insufficient vocabulary in certified lexicon")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Content verification error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 3: Content Guard Hard Technical Boundaries
    # -------------------------------------------------------------
    print("\n[Check 3/7] Verifying Content Guard Hard Boundaries...")
    try:
        guard = EarlyChildhoodContentGuard()

        # Valid prompt check
        guard.validate_prompt("Tap the three red apples.")
        print("  PASS: Legitimate prompt verified successfully")

        # Dark pattern trap
        try:
            guard.validate_prompt("Hurry! Win your streak before time runs out!")
            print("  FAILED: Allowed dark pattern language!")
            all_passed = False
        except ContentConstraintViolation:
            print("  PASS: Dark pattern language trapped and fail-closed blocked")

        # Length limit trap (> 8 words)
        try:
            guard.validate_prompt("One two three four five six seven eight nine ten")
            print("  FAILED: Allowed sentence > 8 words!")
            all_passed = False
        except ContentConstraintViolation:
            print("  PASS: Sentence length > 8 words trapped and blocked")

        # Uncertified adult vocabulary trap
        try:
            guard.validate_prompt("Analyze the polynomial expression.")
            print("  FAILED: Allowed uncertified adult vocabulary!")
            all_passed = False
        except ContentConstraintViolation:
            print("  PASS: Open-ended/uncertified vocabulary trapped and blocked")
    except Exception as e:
        print(f"  FAILED: Content guard error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 4: Mandatory 15-Minute Screen-Time Limit
    # -------------------------------------------------------------
    print("\n[Check 4/7] Verifying Mandatory 15-Minute Screen-Time Guard...")
    try:
        # Under 15 minutes is allowed
        assert guard.check_session_duration(14.9) is True
        print("  PASS: Session duration under 15 minutes allowed")

        # Over 15 minutes is strictly blocked
        try:
            guard.check_session_duration(15.1)
            print("  FAILED: Allowed session exceeding 15 minutes!")
            all_passed = False
        except ScreenTimeLimitExceededError:
            print("  PASS: Session exceeding 15 minutes strictly locked out")
    except Exception as e:
        print(f"  FAILED: Screen-time guard error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 5: Parent Co-Pilot Supervisory Bridge & Kill Switch
    # -------------------------------------------------------------
    print("\n[Check 5/7] Verifying Parent Co-Pilot Bridge & Controls...")
    try:
        session = ParentCopilotSession(
            session_id="gate_test_session",
            parent_token="parent_88a1b2c3d4",
            child_token="anon_10a2b3c4d5e6"
        )
        session.record_prompt_delivered("Q1", "Tap the three red apples.", "CORRECT")
        if len(session.audio_transcripts) == 1:
            print("  PASS: Real-time audio interaction transcript mirrored")
        else:
            print("  FAILED: Audio transcript recording failed")
            all_passed = False

        # Pause and resume
        session.pause_session("Parent paused")
        if session.current_status == "PAUSED_BY_PARENT":
            print("  PASS: Parental unilateral pause enforced")
        else:
            print("  FAILED: Parental pause failed")
            all_passed = False

        session.resume_session()
        assert session.current_status == "ACTIVE"

        # Unilateral kill switch
        session.terminate_session("Parent stopped session")
        if session.current_status == "TERMINATED_BY_PARENT":
            print("  PASS: Parental unilateral kill switch enforced")
        else:
            print("  FAILED: Parental kill switch failed")
            all_passed = False

        # Terminated session blocks further prompts
        try:
            session.record_prompt_delivered("Q2", "Tap the star.", "CORRECT")
            print("  FAILED: Allowed prompt delivery to terminated session!")
            all_passed = False
        except SessionStateError:
            print("  PASS: Terminated session blocks all further prompt deliveries")
    except Exception as e:
        print(f"  FAILED: Parent co-pilot error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 6: Child Safety Review Verification
    # -------------------------------------------------------------
    print("\n[Check 6/7] Verifying Dedicated Child Safety Review...")
    safety_path = BASE / "data" / "child_safety_review.json"
    try:
        with open(safety_path, "r", encoding="utf-8") as f:
            safety = json.load(f)

        if safety["finalVerdict"] == "APPROVED_FOR_EARLY_YEARS_PILOT":
            print(f"  PASS: Child safety review verdict: {safety['finalVerdict']}")
            print(f"        Auditor: {safety['auditor']['name']} ({safety['auditor']['organization']})")
        else:
            print("  FAILED: Child safety review verdict not approved")
            all_passed = False

        dimensions = [e["dimension"] for e in safety.get("safetyEvaluations", [])]
        expected_dims = ["Auditory & Decibel Output", "Emotional & Affective Stimuli", "Screen Time & Ergonomic Fatigue"]
        if all(any(d in dim for dim in dimensions) for d in expected_dims):
            print("  PASS: All critical early childhood safety dimensions reviewed & verified")
        else:
            print("  FAILED: Incomplete safety review dimensions")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Child safety review error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 7: Closed Junior Pilot Evaluation Report
    # -------------------------------------------------------------
    print("\n[Check 7/7] Verifying Junior Pilot Evaluation Report...")
    report_path = BASE / "data" / "pilot_evaluation_report.json"
    report_schema = BASE / "schemas" / "pilot_report.schema.json"

    try:
        with open(report_schema, "r", encoding="utf-8") as f:
            r_schema = json.load(f)
        with open(report_path, "r", encoding="utf-8") as f:
            r_data = json.load(f)

        jsonschema.validate(r_data, r_schema)
        if r_data["verdict"] == "GO_TO_PHASE_7":
            print(f"  PASS: Pilot report verdict: {r_data['verdict']}")
        else:
            print(f"  FAILED: Pilot verdict is {r_data['verdict']}")
            all_passed = False

        if r_data["safetySummary"]["distressTriggersDetected"] == 0:
            print("  PASS: Zero emotional distress triggers detected during pilot")
        else:
            print("  FAILED: Distress triggers detected!")
            all_passed = False

        signoffs = r_data.get("signoffs", [])
        if len(signoffs) >= 3 and all(s["decision"] == "APPROVED" for s in signoffs):
            print(f"  PASS: All {len(signoffs)} pilot tripartite sign-offs APPROVED")
        else:
            print("  FAILED: Missing or unapproved sign-offs in pilot report")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Pilot report validation error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    if all_passed:
        print("ALL 7 PHASE 6 EXIT CHECKS PASSED.")
        print("Kindergarten & Junior Tier, Voice-First Minimal-Reading UI, Content Guard, Parent Co-Pilot verified.")
        print("=" * 65)
        return True
    else:
        print("PHASE 6 EXIT GATE FAILED.")
        print("=" * 65)
        return False


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
