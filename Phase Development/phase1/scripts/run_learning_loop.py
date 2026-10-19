#!/usr/bin/env python3
"""
Full End-to-End Core Learning Loop Simulation (Phase 1)
Executes:
1. Student Onboarding & Diagnostic Assessment
2. Calibration of Initial Prior Knowledge State P(L_0)
3. Adaptive Practice Loop with Bayesian Knowledge Tracing (Corbett & Anderson)
4. Dynamic Next-Item Selection in Zone of Proximal Development (ZPD)
5. Mastery Milestone Triggering (P(L) >= 0.85, consecutive correct >= 3)
6. Teacher Dashboard Visibility & Authoritative Override
"""

import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE.parent))

from phase1.models.bkt_engine import BktEngine, BktParameters
from phase1.models.knowledge_state import TopicKnowledgeState
from phase1.models.item_selector import AdaptiveItemSelector
from phase1.models.teacher_override import TeacherOverrideService
CONTENT_DIR = BASE / "content"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def simulate_student_session():
    print("=================================================================")
    print("YOUVA EdAI — PHASE 1: CORE LEARNING LOOP EXECUTION")
    print("=================================================================")

    # 1. Load curriculum content & diagnostic
    bank_data = load_json(CONTENT_DIR / "grade8_linear_equations_bank.json")
    diag_data = load_json(CONTENT_DIR / "diagnostic_assessment.json")
    questions = bank_data["questions"]

    # 2. Initialize Engines
    bkt = BktEngine(BktParameters(p_l0=0.15, p_t=0.20, p_g=0.25, p_s=0.08))
    selector = AdaptiveItemSelector(bkt)
    teacher_service = TeacherOverrideService()

    # 3. Step 1: Student Diagnostic
    student_id = "stu_delhi_801"
    print(f"\n[STEP 1: DIAGNOSTIC ASSESSMENT] Student: {student_id}")
    diagnostic_answers = [True, True, False, True, True]  # 4 out of 5 correct
    score = sum(1 for a in diagnostic_answers if a)
    prior_pl = diag_data["scoring"][f"{score}_correct_prior_pl"]
    print(f"Diagnostic Score: {score}/5 -> Calibrated Initial P(L_0) = {prior_pl:.2f}")

    # 4. Step 2: Initialize Knowledge State
    state = TopicKnowledgeState(
        student_id=student_id,
        topic_id="linear_equations_one_variable",
        competency_code="MATH-G8-ALG-01",
        current_p_l=prior_pl
    )
    print(f"\n[STEP 2: KNOWLEDGE STATE INITIALIZED]")
    print(f"Topic: {state.topic_id} | Mastery: {state.current_p_l:.2f} | Mastered: {state.is_mastered}")

    # 5. Step 3: Adaptive Practice Loop
    print("\n[STEP 3: ADAPTIVE PRACTICE LOOP]")
    recent_ids = []
    # Simulating 4 answers: [Correct, Correct, Incorrect, Correct]
    simulated_responses = [
        (True, False, 18.5),
        (True, False, 22.0),
        (False, False, 35.0),
        (True, False, 15.0),
        (True, False, 14.0)
    ]

    for idx, (is_correct, hint_used, response_sec) in enumerate(simulated_responses, 1):
        item = selector.select_next_item(state, questions, recent_ids)
        if not item:
            print("Question bank exhausted.")
            break

        recent_ids.append(item["questionId"])
        if len(recent_ids) > 3:
            recent_ids.pop(0)

        attempt = state.record_attempt(
            engine=bkt,
            question_id=item["questionId"],
            is_correct=is_correct,
            hint_used=hint_used,
            response_time_seconds=response_sec
        )

        status_str = "CORRECT" if is_correct else "INCORRECT"
        print(f"  Item {idx}: [{item['questionId']}] {item['text'][:35]}... -> {status_str}")
        print(f"         BKT: Prior={attempt.prior_p_l:.3f} -> Posterior={attempt.posterior_p_l:.3f} -> Next={attempt.next_p_l:.3f}")

    print(f"\nCurrent State after Practice: P(L) = {state.current_p_l:.3f} | Consecutive Correct = {state.consecutive_correct}")

    # 6. Step 4: Teacher Dashboard & Override
    print("\n[STEP 4: TEACHER DASHBOARD & OVERRIDE]")
    print(f"Teacher reviewing Student {student_id} telemetry...")
    override_event = teacher_service.set_student_mastery(
        knowledge_state=state,
        teacher_id="tch_math_delhi_42",
        target_p_l=0.90,
        rationale="Student demonstrated solid algebraic derivation on the classroom blackboard.",
        signature="c4ca4238a0b923820dcc509a6f75849b2827df61a9796013a7c66a87756f6c91a0b923820dcc509a6f75849b"
    )
    print(f"Override Recorded: [{override_event.override_id}] Action: {override_event.action_type}")
    print(f"New Student State: P(L) = {state.current_p_l:.2f} | Mastered: {state.is_mastered}")

    print("\n=================================================================")
    print("SUCCESS: Full Phase 1 Core Learning Loop Executed Validly")
    print("=================================================================")
    return 0


if __name__ == "__main__":
    simulate_student_session()
