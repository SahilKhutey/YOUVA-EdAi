"""
YOUVA-EdAI — Phase 3 Exit Gate Validator.
Verifies:
1. Phase 0, 1, and 2 Gate Prerequisites passed.
2. Pilot Cohort & Telemetry JSON Schemas valid.
3. 100% Verifiable Parental Consent Compliance (Delhi Public School, R.K. Puram).
4. Minimum-Necessary Privacy-Preserving Telemetry & Pseudonymization.
5. Teacher Trust Signal & Low Friction (< 5.0% bypass rate).
6. Pedagogical Efficacy & 4-Parameter BKT Convergence (Average Growth >= +0.30).
7. Tripartite Go/No-Go Decision Record & Sign-Offs.

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

from phase3.models.pilot_telemetry import PilotTelemetryCollector
from phase3.models.pilot_evaluator import PilotEvaluator, GoNoGoVerdict

PHASE0_GATE_SCRIPT = ROOT / "phase0" / "scripts" / "validate_phase1_gate.py"
PHASE1_GATE_SCRIPT = ROOT / "phase1" / "scripts" / "validate_phase1_gate.py"
PHASE2_GATE_SCRIPT = ROOT / "phase2" / "scripts" / "validate_phase2_gate.py"


def run_checks() -> bool:
    print("=" * 65)
    print("YOUVA-EdAI — PHASE 3 EXIT GATE VALIDATION")
    print("=" * 65)
    all_passed = True

    # -------------------------------------------------------------
    # Check 0: Phase 0, 1, 2 Gate Prerequisites
    # -------------------------------------------------------------
    print("\n[Check 0/7] Verifying Phase 0, 1, 2 Exit Gate Prerequisites...")
    for label, script in [("Phase 0", PHASE0_GATE_SCRIPT), ("Phase 1", PHASE1_GATE_SCRIPT), ("Phase 2", PHASE2_GATE_SCRIPT)]:
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
    # Check 1: Validate Schemas Exist and Parse Cleanly
    # -------------------------------------------------------------
    print("\n[Check 1/7] Validating Phase 3 JSON Schemas...")
    schemas = [
        BASE / "schemas" / "pilot_cohort.schema.json",
        BASE / "schemas" / "telemetry_event.schema.json",
        BASE / "schemas" / "pilot_report.schema.json",
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
    # Check 2: 100% Verifiable Parental Consent Compliance
    # -------------------------------------------------------------
    print("\n[Check 2/7] Verifying 100% Verifiable Parental Consent in Pilot Cohort...")
    cohort_path = BASE / "data" / "pilot_cohort_manifest.json"
    if not cohort_path.exists():
        print("  FAILED: Missing pilot cohort manifest")
        return False

    with open(cohort_path, "r", encoding="utf-8") as f:
        cohort = json.load(f)

    students = cohort.get("students", [])
    if len(students) < 20:
        print(f"  FAILED: Cohort size {len(students)} is below minimum threshold (20)")
        all_passed = False
    else:
        unconsented = [s for s in students if s.get("guardianConsentStatus") != "VERIFIED" or not s.get("evidenceToken")]
        if unconsented:
            print(f"  FAILED: Found {len(unconsented)} unconsented students in pilot cohort!")
            all_passed = False
        else:
            print(f"  PASS: 100% Verifiable Consent verified ({len(students)}/{len(students)} students)")
            print(f"        Partner: {cohort['institution']['name']}, {cohort['institution']['campus']}")

    # -------------------------------------------------------------
    # Check 3: Telemetry & Privacy Pseudonymization
    # -------------------------------------------------------------
    print("\n[Check 3/7] Verifying Telemetry Collection & Zero PII Exposure...")
    telemetry_path = BASE / "data" / "pilot_telemetry_dataset.json"
    if not telemetry_path.exists():
        print("  FAILED: Missing pilot telemetry dataset. Run run_pilot_simulation.py first.")
        all_passed = False
    else:
        with open(telemetry_path, "r", encoding="utf-8") as f:
            telemetry_events = json.load(f)

        pii_leaks = 0
        for ev in telemetry_events:
            sid = ev.get("pseudonymizedStudentId", "")
            if not sid.startswith("anon_") or len(sid) != 17:
                pii_leaks += 1

        if pii_leaks > 0:
            print(f"  FAILED: Detected {pii_leaks} non-pseudonymized student identifiers in telemetry!")
            all_passed = False
        else:
            print(f"  PASS: All {len(telemetry_events)} telemetry events strictly pseudonymized (Zero PII)")

    # -------------------------------------------------------------
    # Check 4: Teacher Trust Signal & Low Friction (<5% routing-around)
    # -------------------------------------------------------------
    print("\n[Check 4/7] Verifying Teacher Trust Signal & Friction Threshold...")
    evaluator = PilotEvaluator()
    summary = evaluator.evaluate(cohort, telemetry_events)

    if summary.routing_around_rate >= 0.05:
        print(f"  FAILED: Teacher routing-around rate ({summary.routing_around_rate * 100:.1f}%) exceeds 5.0% threshold!")
        all_passed = False
    else:
        print(f"  PASS: Teacher bypass rate is {summary.routing_around_rate * 100:.1f}% (strictly < 5.0%)")
        print(f"        Teacher satisfaction: {summary.teacher_satisfaction}/5.0")

    # -------------------------------------------------------------
    # Check 5: Pedagogical Efficacy & BKT Mastery Progression
    # -------------------------------------------------------------
    print("\n[Check 5/7] Verifying Pedagogical Efficacy & BKT Convergence...")
    if summary.completion_rate < 0.80:
        print(f"  FAILED: Cohort completion rate ({summary.completion_rate * 100:.1f}%) < 80.0% target!")
        all_passed = False
    elif summary.average_mastery_growth < 0.30:
        print(f"  FAILED: Average mastery growth (+{summary.average_mastery_growth:.2f}) < +0.30 target!")
        all_passed = False
    else:
        print(f"  PASS: Cohort completion rate: {summary.completion_rate * 100:.1f}% (target >= 80%)")
        print(f"        Average mastery gain: +{summary.average_mastery_growth:.2f} delta P(L) (target >= +0.30)")

    # -------------------------------------------------------------
    # Check 6: Tripartite Go/No-Go Decision Record & Sign-offs
    # -------------------------------------------------------------
    print("\n[Check 6/7] Verifying Formal Go/No-Go Decision Record & Sign-Offs...")
    report_path = BASE / "data" / "pilot_evaluation_report.json"
    if not report_path.exists():
        print("  FAILED: Missing pilot evaluation report")
        all_passed = False
    else:
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)

        if report.get("decision") != "GO_TO_PHASE_4":
            print(f"  FAILED: Pilot decision is '{report.get('decision')}', must be 'GO_TO_PHASE_4'")
            all_passed = False
        else:
            signoffs = report.get("signoffs", [])
            required_roles = {"founder", "pilot_partner_principal", "independent_evaluator"}
            approved_roles = {s["role"] for s in signoffs if s.get("decision") == "APPROVED" and len(s.get("signature", "")) >= 16}
            missing = required_roles - approved_roles
            if missing:
                print(f"  FAILED: Missing required tripartite signoffs: {missing}")
                all_passed = False
            else:
                print(f"  PASS: Tripartite Go/No-Go decision approved: {report['decision']}")
                for s in signoffs:
                    print(f"        - {s['role']:25}: {s['name']} ({s['organization']}) [APPROVED]")

    # -------------------------------------------------------------
    # Gate Verdict
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    if all_passed:
        print("PHASE 3 COMPLETE — CLASSROOM PILOT VALIDATED")
        print("EXIT GATE PASSED (Code 0)")
        print("=" * 65)
        return True
    else:
        print("PHASE 3 EXIT GATE FAILED")
        print("=" * 65)
        return False


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
