"""
YOUVA-EdAi Phase 5: High School Learning & Skills Passport Simulation
Demonstrates:
  1. Grade 10 Diagnostic Assessment execution
  2. BKT adaptive progression on Quadratic Equations
  3. Attempted autonomous AI credential issuance -> Trapped & rejected
  4. Human Teacher cryptographic authorization -> Valid W3C VC 2.0 issued
  5. Cryptographic proof and zero-PII payload verification
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import json
from phase5.models.skills_passport import (
    SkillsPassportEngine,
    HumanAuthorizationRequiredError,
    ZeroPIIViolationError,
    AntiGamingPolicyViolationError
)
from phase5.models.highschool_ux_state import AdolescentUXManager
from phase1.models.bkt_engine import BktEngine, BktParameters
from phase4.models.concept_dag import ConceptDAG


def run_simulation():
    print("=" * 70)
    print("YOUVA-EdAi Phase 5: High School Expansion & Skills Passport Simulation")
    print("=" * 70)

    # 1. Load Grade 10 Concept DAG
    dag_path = PROJECT_ROOT / "phase5" / "content" / "grade10_concept_dag.json"
    dag = ConceptDAG.load_from_json(dag_path)
    topo = dag.topological_sort()
    print(f"\n[1] Grade 10 Concept DAG Loaded ({len(dag.nodes)} nodes, {len(dag.edges)} edges)")
    print(f"    Curricular Sequence: {' -> '.join(topo)}")

    # 2. Student Diagnostic Assessment & BKT Updates
    diag_path = PROJECT_ROOT / "phase5" / "content" / "grade10_diagnostic_assessment.json"
    with open(diag_path, "r", encoding="utf-8") as f:
        diag_data = json.load(f)

    print(f"\n[2] Student Diagnostic Assessment ({len(diag_data['items'])} items):")
    bkt = BktEngine()
    current_p_l = 0.20
    bkt_params = BktParameters(p_l0=0.20, p_t=0.18, p_g=0.25, p_s=0.06)

    # Simulate student answering 4 out of 5 diagnostic items correctly
    simulated_responses = [True, True, True, True, False]
    for idx, is_corr in enumerate(simulated_responses, 1):
        _, next_p = bkt.update(current_p_l, is_corr, bkt_params)
        print(f"    Item {idx} ({diag_data['items'][idx-1]['conceptId']}): {'CORRECT' if is_corr else 'INCORRECT'} -> P(L) = {next_p:.3f}")
        current_p_l = next_p

    # 3. Simulate High School Deliberate Practice Session
    print("\n[3] Simulating High School Deliberate Practice Session:")
    # Student completes 22 questions, 65 minutes on task, 86% accuracy, final BKT mastery 0.892
    session_metrics = {
        "questionsAnswered": 22,
        "timeOnTaskMinutes": 65.0,
        "independentAccuracy": 0.864,
        "finalBktMastery": 0.892
    }
    print(f"    Questions Answered: {session_metrics['questionsAnswered']}")
    print(f"    Time on Task: {session_metrics['timeOnTaskMinutes']} minutes")
    print(f"    Independent Accuracy: {session_metrics['independentAccuracy']*100:.1f}%")
    print(f"    Final BKT Mastery Probability: {session_metrics['finalBktMastery']*100:.1f}% (Threshold >= 85%)")

    ux_manager = AdolescentUXManager()
    student_raw_id = "DPS_DELHI_STU_10A_042"
    engine = SkillsPassportEngine()
    student_did = engine.generate_student_did(student_raw_id)
    velocity = ux_manager.calculate_learning_velocity(0.20, 0.892, 65.0)
    print(f"    Pseudonymized Student DID: {student_did}")
    print(f"    Adolescent Learning Velocity: {velocity} delta P(L) / hour")

    # 4. Strict Invariant Check: Autonomous AI Credential Issuance Rejection
    print("\n[4] Invariant Enforcement: Testing Autonomous AI Credential Issuance:")
    try:
        # Caller attempts to issue credential without human authorization
        engine.create_credential(
            student_did=student_did,
            competency_code="MATH-G10-QUAD-01",
            achievement_name="Class 10 Quadratic Equations Mastery",
            achievement_description="Full mastery of CBSE Class 10 Quadratic Equations",
            metrics=session_metrics,
            teacher_authorization={}  # Empty / missing human authorization
        )
        print("    ERROR: Autonomous AI issuance was NOT blocked!")
    except HumanAuthorizationRequiredError as e:
        print(f"    PASS: Autonomous AI issuance successfully blocked! Caught expected error:")
        print(f"          '{e}'")

    # 5. Legitimate Human Teacher Authorized Issuance
    print("\n[5] Human Faculty Authorized Credential Issuance:")
    teacher_auth = {
        "teacherId": "TCH-DPS-101",
        "teacherRole": "Senior Mathematics Faculty",
        "decision": "APPROVED",
        "authorizedAt": "2026-08-30T10:00:00Z",
        "signature": "sig_ed25519_deshmukh_88f9104b2c"
    }

    credential = engine.create_credential(
        student_did=student_did,
        competency_code="MATH-G10-QUAD-01",
        achievement_name="Class 10 Quadratic Equations Mastery",
        achievement_description="Demonstrated full procedural fluency and conceptual understanding of standard quadratic equations, factorisation, discriminant analysis, and word problem modeling.",
        metrics=session_metrics,
        teacher_authorization=teacher_auth
    )

    print(f"    Credential Issued: {credential['id']}")
    print(f"    Standards: {credential['type']}")
    print(f"    Cryptographic Proof Signature: {credential['proof']['proofValue'][:32]}...")

    # 6. Cryptographic Verification & Zero-PII Check
    print("\n[6] Cryptographic Signature & Zero-PII Verification:")
    is_valid = engine.verify_credential(credential)
    print(f"    Verification Status: {'VALID & TAMPER-FREE' if is_valid else 'FAILED'}")

    qr_payload = engine.export_verification_qr_payload(credential)
    print("    Exported Zero-PII QR Payload:")
    for k, v in qr_payload.items():
        print(f"      - {k}: {v}")

    print("\n" + "=" * 70)
    print("Phase 5 High School Simulation Completed Successfully.")
    print("=" * 70)


if __name__ == "__main__":
    run_simulation()
