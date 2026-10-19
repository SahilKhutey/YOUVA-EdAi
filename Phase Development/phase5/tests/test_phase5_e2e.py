"""
End-to-End Integration Tests for Phase 5 High School Expansion & Skills Passport
"""

import json
import pytest
from pathlib import Path
from phase5.models.skills_passport import (
    SkillsPassportEngine,
    HumanAuthorizationRequiredError
)
from phase5.models.highschool_ux_state import AdolescentUXManager
from phase4.models.concept_dag import ConceptDAG
from phase1.models.bkt_engine import BktEngine, BktParameters

ROOT = Path(__file__).parent.parent.parent
DAG_PATH = ROOT / "phase5" / "content" / "grade10_concept_dag.json"
DIAG_PATH = ROOT / "phase5" / "content" / "grade10_diagnostic_assessment.json"
BANK_PATH = ROOT / "phase5" / "content" / "grade10_quadratic_equations_bank.json"


def test_full_highschool_student_journey():
    # 1. Initialize engines
    dag = ConceptDAG.load_from_json(DAG_PATH)
    engine = SkillsPassportEngine()
    ux_manager = AdolescentUXManager()
    bkt = BktEngine()

    # 2. Student takes diagnostic assessment
    with open(DIAG_PATH, "r", encoding="utf-8") as f:
        diag = json.load(f)
    assert len(diag["items"]) == 5

    # 3. Simulate practice progression
    current_p = 0.20
    bkt_params = BktParameters(p_l0=0.20, p_t=0.18, p_g=0.25, p_s=0.06)
    for _ in range(8):
        _, current_p = bkt.update(current_p, True, bkt_params)

    assert current_p > 0.85  # Mastered

    # 4. Adolescent UX state updates
    did = engine.generate_student_did("DPS_STUDENT_10A_007")
    velocity = ux_manager.calculate_learning_velocity(0.20, current_p, 50.0)
    assert velocity > 0.5

    radar = ux_manager.update_readiness_radar(did, {
        "standard_quadratic_form": 0.98,
        "factorisation_roots": 0.92,
        "discriminant_nature_roots": current_p
    })
    assert radar["standard_quadratic_form"] == 0.98

    # 5. Teacher authorizes credential issuance
    teacher_auth = {
        "teacherId": "TCH-DPS-101",
        "teacherRole": "Senior Mathematics Faculty",
        "decision": "APPROVED",
        "authorizedAt": "2026-08-30T10:00:00Z",
        "signature": "sig_deshmukh_valid_proof"
    }
    metrics = {
        "questionsAnswered": 22,
        "timeOnTaskMinutes": 55.0,
        "independentAccuracy": 0.88,
        "finalBktMastery": current_p
    }

    credential = engine.create_credential(
        student_did=did,
        competency_code="MATH-G10-QUAD-01",
        achievement_name="Class 10 Quadratic Equations Mastery",
        achievement_description="Demonstrated procedural fluency in quadratic equations.",
        metrics=metrics,
        teacher_authorization=teacher_auth
    )

    # 6. Verify issued credential
    assert engine.verify_credential(credential) is True
    ux_manager.record_earned_credential(did, credential["id"])

    profile = ux_manager.get_or_create_profile(did)
    assert credential["id"] in profile.earned_credentials
    assert profile.has_cartoon_avatars is False
    assert profile.has_confetti_effects is False
