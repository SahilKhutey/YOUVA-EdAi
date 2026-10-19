"""
Unit tests for ParentCopilotSession
"""

import pytest
from phase6.models.parent_copilot import ParentCopilotSession, SessionStateError


@pytest.fixture
def copilot_session():
    return ParentCopilotSession(
        session_id="test_sess_001",
        parent_token="parent_88a1b2c3d4",
        child_token="anon_10a2b3c4d5e6"
    )


def test_session_init(copilot_session):
    assert copilot_session.current_status == "ACTIVE"
    assert copilot_session.max_duration_minutes == 15.0
    assert len(copilot_session.audio_transcripts) == 0


def test_record_prompt_delivered(copilot_session):
    copilot_session.record_prompt_delivered("Q1", "Tap 3 apples.", "CORRECT")
    assert len(copilot_session.audio_transcripts) == 1
    t = copilot_session.audio_transcripts[0]
    assert t["promptId"] == "Q1"
    assert t["spokenText"] == "Tap 3 apples."
    assert t["childResponse"] == "CORRECT"


def test_pause_and_resume(copilot_session):
    status = copilot_session.pause_session("Snack time")
    assert status == "PAUSED_BY_PARENT"
    assert copilot_session.current_status == "PAUSED_BY_PARENT"

    # Cannot deliver prompt while paused
    with pytest.raises(SessionStateError):
        copilot_session.record_prompt_delivered("Q2", "Find star.", "CORRECT")

    # Resume
    status = copilot_session.resume_session()
    assert status == "ACTIVE"
    copilot_session.record_prompt_delivered("Q2", "Find star.", "CORRECT")
    assert len(copilot_session.audio_transcripts) == 1


def test_unilateral_kill_switch(copilot_session):
    status = copilot_session.terminate_session("Bedtime")
    assert status == "TERMINATED_BY_PARENT"

    # Terminated session cannot be resumed or receive prompts
    with pytest.raises(SessionStateError):
        copilot_session.resume_session()

    with pytest.raises(SessionStateError):
        copilot_session.record_prompt_delivered("Q3", "Find circle.", "CORRECT")


def test_co_play_hint_offered(copilot_session):
    copilot_session.offer_co_play_hint("Count on fingers with child")
    assert len(copilot_session.parent_interventions) == 1
    assert copilot_session.parent_interventions[0]["action"] == "CO_PLAY_HINT_OFFERED"


def test_auto_stopped_time_limit(copilot_session):
    status = copilot_session.check_time_limit(15.0)
    assert status == "AUTO_STOPPED_TIME_LIMIT"
    assert copilot_session.current_status == "AUTO_STOPPED_TIME_LIMIT"
