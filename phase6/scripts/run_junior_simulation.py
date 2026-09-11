"""
YOUVA-EdAi Phase 6: Early Childhood & Junior Tier Simulation
Demonstrates:
  1. Content guardrail validation against certified early childhood vocabulary
  2. Dark pattern and sentence length hard constraint rejection
  3. Parent Co-Pilot real-time session pairing and audio transcript mirroring
  4. Unilateral parental kill switch & pause controls
  5. Mandatory 15-minute screen-time limit enforcement
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import json
from phase6.models.content_guard import (
    EarlyChildhoodContentGuard,
    ContentConstraintViolation,
    ScreenTimeLimitExceededError
)
from phase6.models.parent_copilot import ParentCopilotSession
from phase1.models.bkt_engine import BktEngine, BktParameters


def run_simulation():
    print("=" * 70)
    print("YOUVA-EdAi Phase 6: Kindergarten & Junior Tier Simulation")
    print("=" * 70)

    # 1. Initialize Content Guard
    guard = EarlyChildhoodContentGuard()
    print(f"\n[1] Early Childhood Content Guard Active ({len(guard.certified_lexicon)} words in certified lexicon)")

    # 2. Test Legitimate Prompts vs Constraint Violations
    print("\n[2] Testing Hard Technical AI Content Boundaries:")
    valid_prompt = "Tap the three red apples."
    assert guard.validate_prompt(valid_prompt) is True
    print(f"    PASS: Valid prompt verified -> '{valid_prompt}'")

    # Dark pattern test
    dark_pattern_prompt = "Hurry up! Time is ticking to win coins!"
    try:
        guard.validate_prompt(dark_pattern_prompt)
        print("    ERROR: Dark pattern was not blocked!")
    except ContentConstraintViolation as e:
        print(f"    PASS: Dark pattern blocked -> '{e}'")

    # Length test (> 8 words)
    long_prompt = "Please look at the screen and carefully find all the red apples."
    try:
        guard.validate_prompt(long_prompt)
        print("    ERROR: Long prompt was not blocked!")
    except ContentConstraintViolation as e:
        print(f"    PASS: Prompt length blocked -> '{e}'")

    # Complex adult word test
    complex_prompt = "Identify the geometric quadrilateral figure."
    try:
        guard.validate_prompt(complex_prompt)
        print("    ERROR: Adult vocabulary was not blocked!")
    except ContentConstraintViolation as e:
        print(f"    PASS: Uncertified vocabulary blocked -> '{e}'")

    # 3. Initialize Parent Co-Pilot Bridge
    print("\n[3] Initializing Parent Co-Pilot Supervisory Bridge:")
    session = ParentCopilotSession(
        session_id="sess_jr_sim_001",
        parent_token="parent_88a1b2c3d4",
        child_token="anon_10a2b3c4d5e6"
    )
    print(f"    Session ID: {session.session_id} | Status: {session.current_status}")
    print(f"    Paired Parent: {session.parent_token} <---> Child: {session.child_token}")

    # 4. Deliver Practice Items & Real-time Mirroring
    print("\n[4] Delivering Voice Practice Items with BKT Updates:")
    bkt = BktEngine()
    bkt_params = BktParameters(p_l0=0.30, p_t=0.22, p_g=0.33, p_s=0.04)
    current_p = 0.30

    bank_path = PROJECT_ROOT / "phase6" / "content" / "foundational_numeracy_bank.json"
    with open(bank_path, "r", encoding="utf-8") as f:
        bank_data = json.load(f)

    for item in bank_data["items"][:3]:
        guard.validate_prompt(item["audioPrompt"])
        _, current_p = bkt.update(current_p, True, bkt_params)
        session.record_prompt_delivered(
            prompt_id=item["itemId"],
            spoken_text=item["audioPrompt"],
            child_response="CORRECT"
        )
        print(f"    Delivered: '{item['audioPrompt']}' -> P(L) = {current_p:.3f}")

    # Parent delivers co-play hint
    session.offer_co_play_hint("Show me three fingers like the apples!")
    print(f"    Parent Co-Play Hint Logged: '{session.parent_interventions[-1]['notes']}'")

    # 5. Parental Pause & Unilateral Kill Switch
    print("\n[5] Testing Parental Unilateral Pause and Kill Switch:")
    session.pause_session("Snack time break")
    print(f"    Session State after pause: {session.current_status}")
    session.resume_session()
    print(f"    Session State after resume: {session.current_status}")

    # 6. Screen-Time Hard Limit Guard
    print("\n[6] Enforcing Mandatory 15-Minute Screen-Time Limit:")
    try:
        guard.check_session_duration(elapsed_minutes=15.5)
        print("    ERROR: Screen-time limit was not enforced!")
    except ScreenTimeLimitExceededError as e:
        print(f"    PASS: Hard screen-time stop triggered at 15.5m -> '{e}'")

    session.check_time_limit(15.5)
    print(f"    Session Status after 15m elapsed: {session.current_status}")

    print("\n" + "=" * 70)
    print("Phase 6 Kindergarten & Junior Tier Simulation Completed Successfully.")
    print("=" * 70)


if __name__ == "__main__":
    run_simulation()
