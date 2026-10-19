"""
YOUVA-EdAI — Phase 4 Exit Gate Validator.
Verifies:
1. Phase 0, 1, 2, and 3 Gate Prerequisites passed.
2. Concept DAG Schema Validation & Cycle-Free Guarantee (Acyclicity invariant).
3. Topological Sorting & Curricular Reachability across all CBSE Grade 8 Linear Equations nodes.
4. Backward Prerequisite Remediation Path Tracing for foundational gaps.
5. 3-Tier Adaptive Hint Scaffolding Schema, Progressive Disclosure, and BKT Parameter Calibration.
6. Student Mistake Taxonomy & Diagnostic Feedback Classification across 5 canonical error categories.
7. Speculative Cognitive Metrics Purge Audit & Educator Override Calibration Review Loop.

Exits 0 on success, exits 1 on failure.
"""

import json
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
sys.path.insert(0, str(ROOT))

from phase4.models.concept_dag import ConceptDAG, CycleDetectedError, ConceptNode, PrerequisiteEdge
from phase4.models.hint_scaffolding import HintScaffoldingEngine, HintProgressionViolation
from phase4.models.error_analyzer import ErrorAnalyzer
from phase4.models.override_review import TeacherOverrideReviewer, OverrideEvent

PHASE0_GATE_SCRIPT = ROOT / "phase0" / "scripts" / "validate_phase1_gate.py"
PHASE1_GATE_SCRIPT = ROOT / "phase1" / "scripts" / "validate_phase1_gate.py"
PHASE2_GATE_SCRIPT = ROOT / "phase2" / "scripts" / "validate_phase2_gate.py"
PHASE3_GATE_SCRIPT = ROOT / "phase3" / "scripts" / "validate_phase3_gate.py"


def run_checks() -> bool:
    print("=" * 65)
    print("YOUVA-EdAI — PHASE 4 EXIT GATE VALIDATION")
    print("=" * 65)
    all_passed = True

    # -------------------------------------------------------------
    # Check 0: Phase 0, 1, 2, 3 Gate Prerequisites
    # -------------------------------------------------------------
    print("\n[Check 0/7] Verifying Phase 0, 1, 2, 3 Exit Gate Prerequisites...")
    gates = [
        ("Phase 0", PHASE0_GATE_SCRIPT),
        ("Phase 1", PHASE1_GATE_SCRIPT),
        ("Phase 2", PHASE2_GATE_SCRIPT),
        ("Phase 3", PHASE3_GATE_SCRIPT)
    ]
    for label, script in gates:
        if not script.exists():
            print(f"  FAILED: Missing {label} gate script at {script}")
            all_passed = False
        else:
            res = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"  FAILED: {label} prerequisite check failed!")
                print(res.stdout)
                print(res.stderr)
                all_passed = False
            else:
                print(f"  PASS: {label} exit gate prerequisite verified")

    # -------------------------------------------------------------
    # Check 1: Concept DAG Schema & Cycle-Free Guarantee
    # -------------------------------------------------------------
    print("\n[Check 1/7] Validating Concept DAG Schemas & Cycle-Free Invariant...")
    dag_path = BASE / "data" / "grade8_math_concept_dag.json"
    schema_path = BASE / "schemas" / "concept_dag.schema.json"
    
    try:
        import jsonschema
        with open(schema_path, "r", encoding="utf-8") as f:
            dag_schema = json.load(f)
        with open(dag_path, "r", encoding="utf-8") as f:
            dag_data = json.load(f)
        jsonschema.validate(dag_data, dag_schema)
        print("  PASS: Concept DAG conforms to JSON schema")
    except Exception as e:
        print(f"  FAILED: Concept DAG schema validation error: {e}")
        all_passed = False

    try:
        dag = ConceptDAG.load_from_json(dag_path)
        is_acyclic = dag.validate_acyclicity()
        if is_acyclic:
            print(f"  PASS: Concept DAG is strictly acyclic ({len(dag.nodes)} nodes, {len(dag.edges)} edges)")
        else:
            print("  FAILED: Concept DAG failed acyclicity check")
            all_passed = False

        # Verify intentional cycle detection
        cyclic_dag = ConceptDAG()
        cyclic_dag.add_node(ConceptNode("A", "A", "", "FOUNDATIONAL", ""))
        cyclic_dag.add_node(ConceptNode("B", "B", "", "INTERMEDIATE", ""))
        cyclic_dag.add_edge(PrerequisiteEdge("A", "B"))
        cyclic_dag.add_edge(PrerequisiteEdge("B", "A"))
        try:
            cyclic_dag.validate_acyclicity()
            print("  FAILED: Cycle detector failed to catch cyclic dependency!")
            all_passed = False
        except CycleDetectedError:
            print("  PASS: Cycle detection engine accurately traps circular prerequisites")
    except Exception as e:
        print(f"  FAILED: Error during Concept DAG validation: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 2: Topological Sorting & Reachability
    # -------------------------------------------------------------
    print("\n[Check 2/7] Verifying Topological Sort & Curricular Reachability...")
    try:
        order = dag.topological_sort()
        if len(order) == len(dag.nodes):
            print(f"  PASS: Topological sort produced valid sequence of {len(order)} concepts:")
            print(f"        {' -> '.join(order)}")
        else:
            print("  FAILED: Topological sort count mismatch")
            all_passed = False

        # Ensure foundational comes before advanced
        pos_foundational = order.index("arithmetic_integers")
        pos_fractions = order.index("linear_equations_with_fractions")
        pos_word_problems = order.index("word_problems_linear_equations")
        if pos_foundational < pos_fractions < pos_word_problems:
            print("  PASS: Foundational concepts strictly precede advanced concepts in DAG order")
        else:
            print("  FAILED: Topological order violated curriculum progression hierarchy")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Topological sort verification error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 3: Backward Prerequisite Remediation Tracing
    # -------------------------------------------------------------
    print("\n[Check 3/7] Verifying Backward Remediation Path Tracing...")
    try:
        mock_mastery = {
            "arithmetic_integers": 0.40,
            "algebraic_expressions": 0.90,
            "one_step_linear_equations": 0.55,
            "two_step_linear_equations": 0.65,
            "variables_on_both_sides": 0.70,
            "linear_equations_with_fractions": 0.30,
            "word_problems_linear_equations": 0.10
        }
        remediation = dag.find_remediation_path(mock_mastery, "linear_equations_with_fractions", mastery_threshold=0.85)
        # Arithmetic integers & one_step must be present in remediation
        if "arithmetic_integers" in remediation and "one_step_linear_equations" in remediation:
            print(f"  PASS: Remediation tracer correctly identified foundational gaps: {remediation}")
        else:
            print(f"  FAILED: Remediation tracer missed unmastered prerequisites: {remediation}")
            all_passed = False

        zpd = dag.calculate_zpd_frontier(mock_mastery, mastery_threshold=0.85)
        if "arithmetic_integers" in zpd:
            print(f"  PASS: ZPD learning frontier correctly identifies immediate practice readiness: {zpd}")
        else:
            print(f"  FAILED: ZPD frontier calculation error: {zpd}")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Remediation path tracing error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 4: 3-Tier Hint Scaffolding & Progressive Disclosure
    # -------------------------------------------------------------
    print("\n[Check 4/7] Verifying 3-Tier Hint Scaffolding Engine...")
    hints_path = BASE / "data" / "question_hints_bank.json"
    hint_schema_path = BASE / "schemas" / "hint_scaffolding.schema.json"

    try:
        with open(hint_schema_path, "r", encoding="utf-8") as f:
            hint_schema = json.load(f)
        with open(hints_path, "r", encoding="utf-8") as f:
            hints_data = json.load(f)
        for h_item in hints_data:
            jsonschema.validate(h_item, hint_schema)
        print(f"  PASS: All {len(hints_data)} question scaffolds conform to 3-tier JSON schema")

        hint_engine = HintScaffoldingEngine.load_from_json(hints_path)
        sess = "gate_test_session"
        q = "Q-G8-ALG-001"
        h1 = hint_engine.request_next_hint(sess, q)
        h2 = hint_engine.request_next_hint(sess, q)
        h3 = hint_engine.request_next_hint(sess, q)

        if h1.tier == 1 and h2.tier == 2 and h3.tier == 3:
            print("  PASS: Strict sequential progressive disclosure enforced (Tier 1 -> Tier 2 -> Tier 3)")
        else:
            print(f"  FAILED: Incorrect hint tier progression: {h1.tier}, {h2.tier}, {h3.tier}")
            all_passed = False

        # Enforce tier exhaustion
        try:
            hint_engine.request_next_hint(sess, q)
            print("  FAILED: Allowed requesting beyond Tier 3!")
            all_passed = False
        except HintProgressionViolation:
            print("  PASS: Attempt to request beyond Tier 3 correctly rejected")

        # Calibrated BKT parameters
        pg1, _ = hint_engine.calibrate_bkt_params(0.25, 0.05, 1)
        pg3, _ = hint_engine.calibrate_bkt_params(0.25, 0.05, 3)
        if pg3 > pg1 > 0.25:
            print(f"  PASS: BKT evidence discounting operates monotonically: P(G)_base=0.25 -> P(G)_t1={pg1:.3f} -> P(G)_t3={pg3:.3f}")
        else:
            print(f"  FAILED: BKT parameter calibration invalid: base=0.25, t1={pg1}, t3={pg3}")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Hint scaffolding verification error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 5: Student Mistake Taxonomy & Diagnostic Feedback
    # -------------------------------------------------------------
    print("\n[Check 5/7] Verifying Student Mistake Taxonomy & Diagnostic Feedback...")
    tax_path = BASE / "data" / "error_classification_rules.json"
    tax_schema = BASE / "schemas" / "error_taxonomy.schema.json"
    try:
        with open(tax_schema, "r", encoding="utf-8") as f:
            s_data = json.load(f)
        with open(tax_path, "r", encoding="utf-8") as f:
            t_data = json.load(f)
        jsonschema.validate(t_data, s_data)
        print("  PASS: Error taxonomy rules conform to JSON schema")

        analyzer = ErrorAnalyzer(tax_path)
        required_codes = [
            "SIGN_ERROR",
            "DISTRIBUTIVE_ERROR",
            "COMBINING_LIKE_TERMS_ERROR",
            "FRACTION_CLEARANCE_ERROR",
            "ARITHMETIC_ERROR"
        ]
        all_present = all(c in analyzer.rules for c in required_codes)
        if all_present:
            print(f"  PASS: All 5 canonical error taxonomy codes present: {required_codes}")
        else:
            print(f"  FAILED: Missing error codes in rules: {set(required_codes) - set(analyzer.rules.keys())}")
            all_passed = False

        # Test diagnostic feedback generation
        fb = analyzer.analyze_error("2x - 3 = 7", "x = 2", "x = 5")
        if fb.error_code == "SIGN_ERROR" and fb.remedial_action:
            print("  PASS: Correctly classified sign error with remedial pedagogical action")
        else:
            print(f"  FAILED: Diagnostic feedback classification failed: {fb}")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Error taxonomy verification error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 6: Pruned Cognitive Metrics Audit Log Verification
    # -------------------------------------------------------------
    print("\n[Check 6/7] Verifying Speculative Cognitive Metrics Purge Audit...")
    pruned_path = BASE / "data" / "pruned_cognitive_metrics.json"
    try:
        with open(pruned_path, "r", encoding="utf-8") as f:
            audit = json.load(f)

        purged_names = [m["metricName"] for m in audit.get("prunedMetrics", [])]
        expected_purged = [
            "CognitiveTwinState",
            "VARK_LearningStyleHeuristic",
            "NeuroAttentionalIndex",
            "EmotionalValenceGuessing",
            "InnateAptitudeIQProjection"
        ]
        if all(p in purged_names for p in expected_purged):
            print(f"  PASS: All {len(expected_purged)} speculative cognitive metrics audited & purged")
            print("        Replaced with empirical BKT probabilities, mistake taxonomy & concept DAG.")
        else:
            print(f"  FAILED: Incomplete cognitive metric purge log. Expected {expected_purged}, got {purged_names}")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Cognitive metrics audit log error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Check 7: Teacher Override Review Loop & Calibration
    # -------------------------------------------------------------
    print("\n[Check 7/7] Verifying Educator Override Pattern Review Loop...")
    try:
        reviewer = TeacherOverrideReviewer(override_threshold_for_calibration=2)
        reviewer.record_recommendation_served()
        reviewer.record_recommendation_served()
        reviewer.record_recommendation_served()
        reviewer.record_recommendation_served()

        reviewer.record_override(OverrideEvent(
            override_id="ovr_test_1",
            teacher_id="TCH-001",
            student_id="STU-001",
            concept_id="word_problems_linear_equations",
            ai_recommendation={"difficulty": "HARD"},
            teacher_decision={"difficulty": "MEDIUM"},
            reason_category="DIFFICULTY_TOO_HIGH",
            reason_notes="Too complex for current class progress."
        ))
        reviewer.record_override(OverrideEvent(
            override_id="ovr_test_2",
            teacher_id="TCH-002",
            student_id="STU-002",
            concept_id="word_problems_linear_equations",
            ai_recommendation={"difficulty": "HARD"},
            teacher_decision={"difficulty": "MEDIUM"},
            reason_category="DIFFICULTY_TOO_HIGH",
            reason_notes="Requires word problem reading comprehension scaffold."
        ))

        rep = reviewer.analyze_patterns()
        if len(rep.calibration_recommendations) > 0:
            rec = rep.calibration_recommendations[0]
            print(f"  PASS: Override loop triggered calibration recommendation for '{rec.concept_id}'")
            print(f"        Recommended Adjustment: {rec.recommended_adjustment}")
        else:
            print("  FAILED: Calibration recommendation not triggered when threshold met")
            all_passed = False
    except Exception as e:
        print(f"  FAILED: Teacher override review loop error: {e}")
        all_passed = False

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    if all_passed:
        print("ALL 7 PHASE 4 EXIT CHECKS PASSED.")
        print("Personalization depth verified: DAG, 3-tier hints, mistake taxonomy, override loop, and metric purge complete.")
        print("=" * 65)
        return True
    else:
        print("PHASE 4 EXIT GATE FAILED.")
        print("=" * 65)
        return False


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
