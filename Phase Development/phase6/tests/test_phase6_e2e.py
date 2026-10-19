"""
End-to-End Integration Tests for Phase 6 Kindergarten & Junior Tier
"""

import json
import pytest
from pathlib import Path
from phase6.models.content_guard import (
    EarlyChildhoodContentGuard,
    ContentConstraintViolation,
    ScreenTimeLimitExceededError
)
from phase6.models.parent_copilot import ParentCopilotSession
from phase6.models.junior_pilot_evaluator import JuniorPilotEvaluator
from phase1.models.bkt_engine import BktEngine, BktParameters

ROOT = Path(__file__).parent.parent.parent
BANK_PATH = ROOT / "phase6" / "content" / "foundational_numeracy_bank.json"
MANIFEST_PATH = ROOT / "phase6" / "data" / "pilot_cohort_manifest.json"


def test_full_junior_learning_cycle():
    # 1. Initialize guard, copilot, and BKT
    guard = EarlyChildhoodContentGuard()
    copilot = ParentCopilotSession(
        session_id="e2e_sess_jr_01",
        parent_token="parent_88a1b2c3d4",
        child_token="anon_10a2b3c4d5e6"
    )
    bkt = BktEngine()
    bkt_params = BktParameters(p_l0=0.30, p_t=0.22, p_g=0.33, p_s=0.04)

    # 2. Load questions
    with open(BANK_PATH, "r", encoding="utf-8") as f:
        bank = json.load(f)

    # 3. Simulate child answering 4 questions with voice prompt validation
    current_p = 0.30
    for item in bank["items"][:4]:
        # Guard verifies prompt text
        assert guard.validate_prompt(item["audioPrompt"]) is True
        
        # Deliver prompt to child & log in parent copilot
        copilot.record_prompt_delivered(item["itemId"], item["audioPrompt"], "CORRECT")
        
        # BKT update
        _, current_p = bkt.update(current_p, True, bkt_params)

    assert current_p > 0.85
    assert len(copilot.audio_transcripts) == 4

    # 4. Parent offers co-play hint
    copilot.offer_co_play_hint("Good job counting the red apples!")
    assert len(copilot.parent_interventions) == 1

    # 5. Parent pauses session
    copilot.pause_session("Drink water break")
    assert copilot.current_status == "PAUSED_BY_PARENT"

    # 6. Screen time limit enforcement
    assert guard.check_session_duration(14.0) is True
    with pytest.raises(ScreenTimeLimitExceededError):
        guard.check_session_duration(15.2)


def test_junior_pilot_evaluator_pass():
    evaluator = JuniorPilotEvaluator()
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        cohort = json.load(f)

    telemetry = {
        "distressTriggersDetected": 0,
        "totalInteractions": 300,
        "facilitatorBypasses": 1,
        "averageMasteryGain": 0.45,
        "p95LatencyMs": 235.0
    }

    report = evaluator.evaluate(cohort, telemetry)
    assert report["verdict"] == "GO_TO_PHASE_7"
    assert report["allPassed"] is True
    assert report["safetySummary"]["distressTriggersDetected"] == 0
