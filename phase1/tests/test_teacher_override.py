import pytest
from phase1.models.knowledge_state import TopicKnowledgeState
from phase1.models.teacher_override import TeacherOverrideService


def test_teacher_set_mastery_authoritative():
    """Teacher can directly set mastery probability with rationale and signature."""
    service = TeacherOverrideService()
    state = TopicKnowledgeState(
        student_id="s1",
        topic_id="linear_eq",
        competency_code="MATH-G8-ALG-01",
        current_p_l=0.35
    )

    sig = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
    event = service.set_student_mastery(
        knowledge_state=state,
        teacher_id="tch_01",
        target_p_l=0.95,
        rationale="Demonstrated thorough mastery in classroom discussion.",
        signature=sig
    )

    assert state.current_p_l == 0.95
    assert state.is_mastered is True
    assert event.previous_value == 0.35
    assert event.new_value == 0.95
    assert len(service.override_history) == 1


def test_teacher_override_requires_signature():
    """Override attempt without signature must fail closed."""
    service = TeacherOverrideService()
    state = TopicKnowledgeState("s1", "topic1", "COMP-01", 0.50)

    with pytest.raises(ValueError, match="Teacher cryptographic signature required"):
        service.set_student_mastery(
            knowledge_state=state,
            teacher_id="tch_01",
            target_p_l=0.90,
            rationale="Valid pedagogical rationale text here.",
            signature=""
        )


def test_teacher_override_requires_rationale():
    """Override attempt without rationale must fail closed."""
    service = TeacherOverrideService()
    state = TopicKnowledgeState("s1", "topic1", "COMP-01", 0.50)
    sig = "a1b2c3d4e5f60718293a4b5c6d7e8f90"

    with pytest.raises(ValueError, match="Substantive pedagogical rationale required"):
        service.set_student_mastery(
            knowledge_state=state,
            teacher_id="tch_01",
            target_p_l=0.90,
            rationale="short",
            signature=sig
        )


def test_force_diagnostic():
    """Teacher can force student back to diagnostic state."""
    service = TeacherOverrideService()
    state = TopicKnowledgeState("s1", "topic1", "COMP-01", 0.85, is_mastered=True)
    sig = "a1b2c3d4e5f60718293a4b5c6d7e8f90"

    event = service.force_diagnostic(
        knowledge_state=state,
        teacher_id="tch_01",
        rationale="Curriculum standard refresh required.",
        signature=sig
    )

    assert state.current_p_l == 0.15
    assert state.is_mastered is False
    assert event.action_type == "FORCE_DIAGNOSTIC"
