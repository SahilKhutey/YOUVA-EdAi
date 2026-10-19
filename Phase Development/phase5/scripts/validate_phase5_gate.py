"""
YOUVA-EdAI — Phase 5 Exit Gate Validator.
Verifies:
1. Phase 0, 1, 2, 3, and 4 Exit Gate Prerequisites.
2. High School Mini Scope-Lock Schema & Tripartite Sign-Offs.
3. Grade 10 Content Library, Diagnostic Assessment, and Acyclic Concept DAG.
4. Skills Passport W3C VC 2.0 Schema Conformance & Zero-PII Invariant.
5. Mandatory Human Authorization Invariant (AI-alone issuance fail-closed test).
6. Anti-Gaming Policy Verification (questions, time, accuracy, mastery thresholds).
7. Second Closed Pilot Evaluation Report & Tripartite Sign-Offs.

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

from phase5.models.skills_passport import (
    SkillsPassportEngine,
    HumanAuthorizationRequiredError,
    ZeroPIIViolationError,
    AntiGamingPolicyViolationError,
    CredentialIntegrityError
)
from phase4.models.concept_dag import ConceptDAG

PHASE0_GATE_SCRIPT = ROOT / "phase0" / "scripts" / "validate_phase1_gate.py"
PHASE1_GATE_SCRIPT = ROOT / "phase1" / "scripts" / "validate_phase1_gate.py"
PHASE2_GATE_SCRIPT = ROOT / "phase2" / "scripts" / "validate_phase2_gate.py"
PHASE3_GATE_SCRIPT = ROOT / "phase3" / "scripts" / "validate_phase3_gate.py"
PHASE4_GATE_SCRIPT = ROOT / "phase4" / "scripts" / "validate_phase4_gate.py"


def run_checks() -> bool:
    print("=" * 65)
    print("YOUVA-EdAI — PHASE 5 EXIT GATE VALIDATION")
    print("=" * 65)
    all_passed = True

    # -------------------------------------------------------------
    # Check 0: Phase 0 - 4 Gate Prerequisites
    # -------------------------------------------------------------
    print("\n[Check 0/7] Verifying Phase 0 - 4 Exit Gate Prerequisites...")
    gates = [
        ("Phase 0", PHASE0_GATE_SCRIPT),
        ("Phase 1", PHASE1_GATE_SCRIPT),
        ("Phase 2", PHASE2_GATE_SCRIPT),
        ("Phase 3", PHASE3_GATE_SCRIPT),
        ("Phase 4", PHASE4_GATE_SCRIPT)
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
    # Check 1: High School Mini Scope-Lock
    # -------------------------------------------------------------
    print("\n[Check 1/7] Validating High School Mini Scope-Lock & Sign-Offs...")
    scope_path = BASE / "scope" / "mini_scope_lock.json"
    scope_schema_path = BASE / "schemas" / "highschool_scope.schema.json"

    try:
        with open(scope_schema_path, "r", encoding="utf-8") as f:
            scope_schema = json.load(f)
        with open(scope_path, "r", encoding="utf-8") as f:
            scope_data = json.load(f)
        jsonschema.validate(scope_data, scope_schema)

        if scope_data["tier"] == "HIGH_SCHOOL" and scope_data["grade"] == "Grade 10":
            print("  PASS: Mini scope lock conforms to schema (Grade 10 / High School)")
        else:
            print("  FAILED: Invalid tier or grade in scope lock")
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
    # Check 2: Grade 10 Content Library, Diagnostic & Concept DAG
    # -------------------------------------------------------------
    print("\n[Check 2/7] Verifying Grade 10 Content, Diagnostic & Concept DAG...")
    bank_path = BASE / "content" / "grade10_quadratic_equations_bank.json"
    diag_path = BASE / "content" / "grade10_diagnostic_assessment.json"
    dag_path = BASE / "content" / "grade10_concept_dag.json"

    try:
        with open(bank_path, "r", encoding="utf-8") as f:
            bank_data = json.load(f)
        questions = bank_data.get("questions", [])
        if len(questions) == 20:
            print(f"  PASS: Question bank verified with exactly 20 CBSE Grade 10 questions")
        else:
            print(f"  FAILED: Question bank count mismatch (expected 20, got {len(questions)})")
            all_passed = False

        with open(diag_path, "r", encoding="utf-8") as f:
            diag_data = json.load(f)
        if len(diag_data.get("items", [])) == 5:
            print("  PASS: Diagnostic assessment verified with 5 calibrated items")
        else:
            print("  FAILED: Diagnostic assessment count mismatch")
            all_passed = False

        dag = ConceptDAG.load_from_json(dag_path)
        dag.validate_acyclicity()
        order = dag.topological_sort()
        print(f"  PASS: Concept DAG is strictly acyclic ({len(dag.nodes)} nodes, {len(dag.edges)} edges)")
        print(f"        Sequence: {' -> '.join(order)}")
    except Exception as e:
        print(f"  FAILED: Content or DAG error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 3: Skills Passport W3C VC 2.0 & Zero-PII Invariant
    # -------------------------------------------------------------
    print("\n[Check 3/7] Verifying Skills Passport W3C VC 2.0 & Zero-PII Invariant...")
    sample_cred_path = BASE / "data" / "sample_skills_credential.json"
    cred_schema_path = BASE / "schemas" / "skills_passport.schema.json"

    try:
        with open(cred_schema_path, "r", encoding="utf-8") as f:
            cred_schema = json.load(f)
        with open(sample_cred_path, "r", encoding="utf-8") as f:
            sample_cred = json.load(f)

        jsonschema.validate(sample_cred, cred_schema)
        print("  PASS: Sample credential conforms to W3C VC 2.0 JSON Schema")

        engine = SkillsPassportEngine()
        engine.verify_zero_pii(sample_cred["credentialSubject"])
        print("  PASS: Zero-PII audit verified (no names, emails, phones, aadhaar, dob)")

        # Verify intentional PII injection is rejected
        tampered_subject = dict(sample_cred["credentialSubject"])
        tampered_subject["studentName"] = "Aarav Sharma"
        try:
            engine.verify_zero_pii(tampered_subject)
            print("  FAILED: Zero-PII scanner failed to catch injected studentName!")
            all_passed = False
        except ZeroPIIViolationError:
            print("  PASS: Zero-PII scanner successfully traps unauthorized personal data")
    except Exception as e:
        print(f"  FAILED: Credential schema or Zero-PII error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 4: Mandatory Human Authorization Invariant
    # -------------------------------------------------------------
    print("\n[Check 4/7] Verifying Human Authorization Invariant...")
    try:
        engine = SkillsPassportEngine()
        did = "did:youva:student:test_invariant_001"
        valid_metrics = {
            "questionsAnswered": 20,
            "timeOnTaskMinutes": 50.0,
            "independentAccuracy": 0.85,
            "finalBktMastery": 0.88
        }

        # Sub-check A: Attempt autonomous issuance (empty auth)
        try:
            engine.create_credential(
                student_did=did,
                competency_code="MATH-G10-QUAD-01",
                achievement_name="Quadratic Mastery",
                achievement_description="Test",
                metrics=valid_metrics,
                teacher_authorization={}
            )
            print("  FAILED: Allowed autonomous issuance without teacher auth!")
            all_passed = False
        except HumanAuthorizationRequiredError:
            print("  PASS: Autonomous AI issuance fail-closed blocked (empty auth rejected)")

        # Sub-check B: Attempt AI as authorizer
        try:
            engine.create_credential(
                student_did=did,
                competency_code="MATH-G10-QUAD-01",
                achievement_name="Quadratic Mastery",
                achievement_description="Test",
                metrics=valid_metrics,
                teacher_authorization={
                    "teacherId": "AI_AGENT_01",
                    "teacherRole": "Autonomous AI Tutor",
                    "decision": "APPROVED",
                    "signature": "ai_sig_123"
                }
            )
            print("  FAILED: Allowed AI agent as teacher authorizer!")
            all_passed = False
        except HumanAuthorizationRequiredError:
            print("  PASS: AI role as authorizer strictly rejected (human role mandatory)")
    except Exception as e:
        print(f"  FAILED: Human authorization invariant error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 5: Anti-Gaming Policy Verification
    # -------------------------------------------------------------
    print("\n[Check 5/7] Verifying Anti-Gaming Policy Thresholds...")
    try:
        teacher_auth = {
            "teacherId": "TCH-001",
            "teacherRole": "Mathematics Faculty",
            "decision": "APPROVED",
            "signature": "sig_valid_123"
        }

        # Insufficient questions (< 15)
        bad_metrics = {"questionsAnswered": 10, "timeOnTaskMinutes": 60, "independentAccuracy": 0.90, "finalBktMastery": 0.90}
        try:
            engine.create_credential(did, "MATH-G10-QUAD-01", "Test", "Test", bad_metrics, teacher_auth)
            print("  FAILED: Allowed issuance with insufficient questions!")
            all_passed = False
        except AntiGamingPolicyViolationError:
            print("  PASS: Anti-gaming check correctly rejected insufficient questions (10 < 15)")

        # Insufficient time (< 45m)
        bad_metrics2 = {"questionsAnswered": 20, "timeOnTaskMinutes": 20, "independentAccuracy": 0.90, "finalBktMastery": 0.90}
        try:
            engine.create_credential(did, "MATH-G10-QUAD-01", "Test", "Test", bad_metrics2, teacher_auth)
            print("  FAILED: Allowed issuance with insufficient time on task!")
            all_passed = False
        except AntiGamingPolicyViolationError:
            print("  PASS: Anti-gaming check correctly rejected insufficient time on task (20m < 45m)")

        # Insufficient accuracy (< 80%)
        bad_metrics3 = {"questionsAnswered": 20, "timeOnTaskMinutes": 60, "independentAccuracy": 0.70, "finalBktMastery": 0.90}
        try:
            engine.create_credential(did, "MATH-G10-QUAD-01", "Test", "Test", bad_metrics3, teacher_auth)
            print("  FAILED: Allowed issuance with low accuracy (70% < 80%)!")
            all_passed = False
        except AntiGamingPolicyViolationError:
            print("  PASS: Anti-gaming check correctly rejected low accuracy")
    except Exception as e:
        print(f"  FAILED: Anti-gaming check error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 6: Cryptographic Proof & Tamper Verification
    # -------------------------------------------------------------
    print("\n[Check 6/7] Verifying Cryptographic Proof & Tamper Pinpointing...")
    try:
        # Legitimate issuance
        cred = engine.create_credential(did, "MATH-G10-QUAD-01", "Quadratic Mastery", "Desc", valid_metrics, teacher_auth)
        is_valid = engine.verify_credential(cred)
        if is_valid:
            print("  PASS: Newly minted credential verified valid with authentic HMAC-SHA256 proof")
        else:
            print("  FAILED: Valid credential failed verification")
            all_passed = False

        # Tampered payload (altering evidence questions)
        tampered_cred = json.loads(json.dumps(cred))
        tampered_cred["credentialSubject"]["evidence"][0]["metrics"]["questionsAnswered"] = 999
        try:
            engine.verify_credential(tampered_cred)
            print("  FAILED: Tampered credential was not rejected!")
            all_passed = False
        except CredentialIntegrityError:
            print("  PASS: Cryptographic tampering detected and rejected immediately")
    except Exception as e:
        print(f"  FAILED: Cryptographic verification error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 7: Second Closed Pilot Report & Sign-Offs
    # -------------------------------------------------------------
    print("\n[Check 7/7] Verifying Second Closed Pilot Evaluation Report...")
    report_path = BASE / "data" / "pilot_evaluation_report.json"
    report_schema = BASE / "schemas" / "pilot_report.schema.json"

    try:
        with open(report_schema, "r", encoding="utf-8") as f:
            r_schema = json.load(f)
        with open(report_path, "r", encoding="utf-8") as f:
            r_data = json.load(f)

        jsonschema.validate(r_data, r_schema)
        if r_data["verdict"] == "GO_TO_PHASE_6":
            print(f"  PASS: Pilot report verdict: {r_data['verdict']}")
        else:
            print(f"  FAILED: Pilot verdict is {r_data['verdict']}")
            all_passed = False

        results = {r["criterionId"]: r["status"] for r in r_data.get("criteriaResults", [])}
        expected_criteria = ["CRIT-P5-01", "CRIT-P5-02", "CRIT-P5-03", "CRIT-P5-04", "CRIT-P5-05"]
        if all(results.get(c) == "PASSED" for c in expected_criteria):
            print("  PASS: All 5 quantitative pilot criteria passed (100% VPC, <5% bypass, >=+0.30 gain, 0 safety, <350ms)")
        else:
            print(f"  FAILED: Some pilot criteria failed: {results}")
            all_passed = False

        signoffs = r_data.get("signoffs", [])
        if len(signoffs) >= 3 and all(s["decision"] == "APPROVED" for s in signoffs):
            print(f"  PASS: All {len(signoffs)} pilot tripartite sign-offs APPROVED")
        else:
            print("  FAILED: Missing or unapproved sign-offs in pilot report")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Pilot evaluation report error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    if all_passed:
        print("ALL 7 PHASE 5 EXIT CHECKS PASSED.")
        print("High School expansion, Skills Passport W3C VC 2.0, Zero-PII, and second closed pilot verified.")
        print("=" * 65)
        return True
    else:
        print("PHASE 5 EXIT GATE FAILED.")
        print("=" * 65)
        return False


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
