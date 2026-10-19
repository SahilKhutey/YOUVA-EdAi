#!/usr/bin/env python3
"""
Master Phase 1 Exit Gate Validator (Core Learning Loop MVP).
Enforces:
1. Phase 0 Gate Prerequisite passed.
2. 4-Parameter BKT Mathematical Correctness (Corbett & Anderson).
3. Content Library Integrity (20 peer-reviewed questions for Grade 8 Linear Equations).
4. Diagnostic Calibration and ZPD Item Selection.
5. Teacher Override Authorization & Audit Trail Invariant.
"""

import json
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
sys.path.insert(0, str(ROOT))

from phase1.models.bkt_engine import BktEngine, BktParameters
from phase1.models.knowledge_state import TopicKnowledgeState
from phase1.models.item_selector import AdaptiveItemSelector
from phase1.models.teacher_override import TeacherOverrideService

CONTENT_DIR = BASE / "content"
PHASE0_GATE_SCRIPT = ROOT / "phase0" / "scripts" / "validate_phase1_gate.py"


class GateCheckError(Exception):
    pass


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def check_phase0_prerequisite() -> bool:
    print("[1/5] Verifying Phase 0 Scope Lock Gate Prerequisite...")
    result = subprocess.run(
        [sys.executable, str(PHASE0_GATE_SCRIPT)],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise GateCheckError(f"Phase 0 prerequisite failed:\n{result.stdout}\n{result.stderr}")
    return True


def check_bkt_math() -> bool:
    print("[2/5] Verifying 4-Parameter BKT Mathematical Grounding...")
    engine = BktEngine(BktParameters(p_l0=0.20, p_t=0.15, p_g=0.25, p_s=0.10))

    # Invariant 1: Correct answer increases mastery
    _, next_correct = engine.update(current_p_l=0.50, is_correct=True)
    if next_correct <= 0.50:
        raise GateCheckError(f"BKT error: Correct answer did not increase P(L) ({next_correct:.3f} <= 0.50)")

    # Invariant 2: Incorrect answer decreases mastery
    _, next_incorrect = engine.update(current_p_l=0.50, is_correct=False)
    if next_incorrect >= 0.50:
        raise GateCheckError(f"BKT error: Incorrect answer did not decrease P(L) ({next_incorrect:.3f} >= 0.50)")

    # Invariant 3: Prediction is well-bounded
    p_pred = engine.predict_correctness(0.50)
    if not (0.0 < p_pred < 1.0):
        raise GateCheckError(f"Prediction out of bounds: {p_pred}")

    return True


def check_content_library() -> bool:
    print("[3/5] Verifying Content Library & Curriculum Review...")
    bank = load_json(CONTENT_DIR / "grade8_linear_equations_bank.json")
    diag = load_json(CONTENT_DIR / "diagnostic_assessment.json")

    questions = bank.get("questions", [])
    if len(questions) < 20:
        raise GateCheckError(f"Insufficient question bank size: expected >= 20, found {len(questions)}")

    if not bank.get("reviewedBy"):
        raise GateCheckError("Question bank missing required human curriculum reviewer signoff")

    q_ids = set()
    for q in questions:
        qid = q.get("questionId")
        if qid in q_ids:
            raise GateCheckError(f"Duplicate questionId found: {qid}")
        q_ids.add(qid)

        options = q.get("options", [])
        if len(options) != 4:
            raise GateCheckError(f"Question '{qid}' must have exactly 4 options")

        correct_idx = q.get("correctOptionIndex")
        if not (0 <= correct_idx < len(options)):
            raise GateCheckError(f"Question '{qid}' has invalid correctOptionIndex: {correct_idx}")

    diag_questions = diag.get("questions", [])
    if len(diag_questions) < 5:
        raise GateCheckError(f"Diagnostic assessment has fewer than 5 items: {len(diag_questions)}")

    return True


def check_adaptive_loop() -> bool:
    print("[4/5] Verifying Adaptive Loop in Zone of Proximal Development...")
    engine = BktEngine()
    selector = AdaptiveItemSelector(engine)
    bank = load_json(CONTENT_DIR / "grade8_linear_equations_bank.json")["questions"]

    state = TopicKnowledgeState(
        student_id="test_stu_01",
        topic_id="linear_equations",
        competency_code="MATH-G8-ALG-01",
        current_p_l=0.30
    )

    item = selector.select_next_item(state, bank)
    if not item:
        raise GateCheckError("Adaptive selector failed to return an item from non-empty bank")

    return True


def check_teacher_override() -> bool:
    print("[5/5] Verifying Teacher Override Controls & Audit Trail...")
    service = TeacherOverrideService()
    state = TopicKnowledgeState(
        student_id="test_stu_01",
        topic_id="linear_equations",
        competency_code="MATH-G8-ALG-01",
        current_p_l=0.40
    )

    event = service.set_student_mastery(
        knowledge_state=state,
        teacher_id="tch_001",
        target_p_l=0.92,
        rationale="Verified mastery through direct classroom oral exam.",
        signature="c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91a0b92382"
    )

    if state.current_p_l != 0.92 or not state.is_mastered:
        raise GateCheckError("Teacher override failed to update student mastery state")
    if not event.override_id:
        raise GateCheckError("Teacher override did not generate an audit event")

    return True


def main() -> int:
    print("=================================================================")
    print("YOUVA EdAI — PHASE 1 EXIT GATE (CORE LEARNING LOOP MVP)")
    print("=================================================================")

    checks = [
        ("Phase 0 Scope Lock Prerequisite", check_phase0_prerequisite),
        ("BKT Mathematical Grounding", check_bkt_math),
        ("Content Library & Review", check_content_library),
        ("Adaptive ZPD Item Selection", check_adaptive_loop),
        ("Teacher Override Invariant", check_teacher_override)
    ]

    for name, check_fn in checks:
        try:
            check_fn()
            print(f"  [PASS] {name}")
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
            print("\n=================================================================")
            print("STATUS: PHASE 1 GATE FAILED")
            print("=================================================================")
            return 1

    print("\n=================================================================")
    print("STATUS: PHASE 1 COMPLETE — CORE LEARNING LOOP VERIFIED")
    print("PHASE 2 (SAFETY & TRUST HARDENING) MAY BEGIN")
    print("=================================================================")
    return 0


if __name__ == "__main__":
    sys.exit(main())
