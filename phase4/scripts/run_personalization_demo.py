"""
YOUVA-EdAi Phase 4: Personalization Depth Demo
Demonstrates the full end-to-end personalization pipeline:
  1. Prerequisite Concept DAG traversal & ZPD frontier identification
  2. Backward prerequisite remediation path tracing
  3. 3-Tier progressive hint scaffolding & BKT evidence calibration
  4. Student algebraic mistake diagnosis & remedial feedback
  5. Teacher override pattern review & model calibration
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from phase4.models.concept_dag import ConceptDAG
from phase4.models.hint_scaffolding import HintScaffoldingEngine
from phase4.models.error_analyzer import ErrorAnalyzer
from phase4.models.override_review import TeacherOverrideReviewer, OverrideEvent
from phase1.models.bkt_engine import BktEngine


def run_demo():
    print("=" * 70)
    print("YOUVA-EdAi Phase 4: Personalization Depth & Scaffolding Demonstration")
    print("=" * 70)

    # 1. Concept DAG
    dag_path = PROJECT_ROOT / "phase4" / "data" / "grade8_math_concept_dag.json"
    dag = ConceptDAG.load_from_json(dag_path)
    topo_order = dag.topological_sort()
    print(f"\n[1] Concept DAG Loaded ({len(dag.nodes)} nodes, {len(dag.edges)} edges)")
    print("    Topological Curriculum Progression:")
    for idx, node_id in enumerate(topo_order, 1):
        node = dag.get_node(node_id)
        print(f"      {idx}. [{node.id}] {node.title} ({node.difficulty_band})")

    # 2. Student Mastery & Backward Remediation Tracing
    # Student wants to learn 'linear_equations_with_fractions' but has weak foundational integer arithmetic
    student_mastery = {
        "arithmetic_integers": 0.45,  # WEAK
        "algebraic_expressions": 0.88,
        "one_step_linear_equations": 0.50,  # WEAK
        "two_step_linear_equations": 0.60,  # WEAK
        "variables_on_both_sides": 0.40,
        "linear_equations_with_fractions": 0.20,
        "word_problems_linear_equations": 0.10
    }
    target = "linear_equations_with_fractions"
    remediation_path = dag.find_remediation_path(student_mastery, target, mastery_threshold=0.85)
    print(f"\n[2] Backward Remediation Path for Target '{target}':")
    for step_idx, cid in enumerate(remediation_path, 1):
        node = dag.get_node(cid)
        print(f"      Step {step_idx}: [{node.id}] {node.title} (Current P(L) = {student_mastery.get(cid, 0.0):.2f})")

    zpd_frontier = dag.calculate_zpd_frontier(student_mastery, mastery_threshold=0.85)
    print(f"    ZPD Learning Frontier (Ready for practice): {zpd_frontier}")

    # 3. 3-Tier Hint Scaffolding
    hints_path = PROJECT_ROOT / "phase4" / "data" / "question_hints_bank.json"
    hint_engine = HintScaffoldingEngine.load_from_json(hints_path)
    session_id = "sess_demo_001"
    qid = "Q-G8-ALG-001"
    bkt = BktEngine()
    base_p_g = 0.25
    base_p_s = 0.05
    initial_p_l = 0.35

    print(f"\n[3] 3-Tier Progressive Hint Scaffolding for Question '{qid}':")
    for tier in range(1, 4):
        hint = hint_engine.request_next_hint(session_id, qid)
        calibrated_pg, calibrated_ps = hint_engine.calibrate_bkt_params(base_p_g, base_p_s, hint.tier)
        print(f"    Tier {hint.tier} [{hint.title}]: {hint.content}")
        print(f"      -> Calibrated BKT parameters: P(G)={calibrated_pg:.3f}, P(S)={calibrated_ps:.3f} (Penalty={hint.penalty_slip_factor})")

    # 4. Error Analysis & Diagnostic Feedback
    print("\n[4] Student Mistake Diagnosis & Misconception Taxonomy:")
    error_analyzer = ErrorAnalyzer()
    
    # Simulate student solving 2x - 3 = 7 and answering x = 2
    feedback1 = error_analyzer.analyze_error(
        question_text="Solve for x: 2x - 3 = 7",
        student_answer="x = 2",
        correct_answer="x = 5"
    )
    print(f"    Student Answer: 'x = 2' | Correct: 'x = 5'")
    print(f"    Error Classified: [{feedback1.error_code}] {feedback1.misconception_name}")
    print(f"    Explanation: {feedback1.explanation}")
    print(f"    Remedial Action: {feedback1.remedial_action}")

    # Simulate distributive error
    feedback2 = error_analyzer.analyze_error(
        question_text="Solve for x: 2(x + 3) = 14",
        student_answer="2x + 3 = 14",
        correct_answer="2x + 6 = 14",
        steps=["2(x+3) -> 2x + 3"]
    )
    print(f"\n    Student Answer: '2x + 3 = 14' | Correct: '2x + 6 = 14'")
    print(f"    Error Classified: [{feedback2.error_code}] {feedback2.misconception_name}")
    print(f"    Explanation: {feedback2.explanation}")

    # 5. Teacher Override Pattern Review Loop
    print("\n[5] Teacher Override Pattern Review & Calibration Loop:")
    override_reviewer = TeacherOverrideReviewer(override_threshold_for_calibration=2)
    # Simulate 20 AI recommendations
    for _ in range(20):
        override_reviewer.record_recommendation_served()

    # Simulate 3 overrides on fractions due to difficulty
    for idx in range(3):
        override_reviewer.record_override(OverrideEvent(
            override_id=f"ovr_demo_{idx}",
            teacher_id="TCH-DEL-001",
            student_id=f"STU-00{idx}",
            concept_id="linear_equations_with_fractions",
            ai_recommendation={"difficulty": "HARD", "questionId": "Q-G8-ALG-015"},
            teacher_decision={"difficulty": "MEDIUM", "questionId": "Q-G8-ALG-004"},
            reason_category="DIFFICULTY_TOO_HIGH",
            reason_notes="Student struggling with fraction denominators; stepping down difficulty."
        ))

    report = override_reviewer.analyze_patterns()
    print(f"    Total Overrides: {report.total_overrides} | Teacher Agreement Rate: {report.teacher_agreement_rate * 100:.1f}%")
    print(f"    Overrides by Reason: {report.overrides_by_reason}")
    print("    Calibration Recommendations Generated:")
    for rec in report.calibration_recommendations:
        print(f"      - Concept [{rec.concept_id}]: {rec.issue_detected}")
        print(f"        Recommended Adjustment: {rec.recommended_adjustment}")
        print(f"        Confidence: {rec.confidence * 100:.0f}% (Based on {rec.supporting_override_count} overrides)")

    print("\n" + "=" * 70)
    print("Phase 4 Personalization Depth Demo Completed Successfully.")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()
