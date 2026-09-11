"""
Teacher Dashboard & Consequential Override Controls
Preserves the permanent invariant: AI recommends, human teachers authorize.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from .knowledge_state import TopicKnowledgeState


@dataclass
class TeacherOverrideEvent:
    override_id: str
    teacher_id: str
    student_id: str
    topic_id: str
    action_type: str  # SET_MASTERY_STATE, FORCE_DIAGNOSTIC, LOCK_SESSION, UNLOCK_SESSION
    rationale: str
    previous_value: Any
    new_value: Any
    signature: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TeacherOverrideService:
    def __init__(self):
        self.override_history: List[TeacherOverrideEvent] = []

    def set_student_mastery(
        self,
        knowledge_state: TopicKnowledgeState,
        teacher_id: str,
        target_p_l: float,
        rationale: str,
        signature: str
    ) -> TeacherOverrideEvent:
        """
        Allows a teacher to authoritatively set a student's mastery probability.
        """
        if not (0.01 <= target_p_l <= 0.99):
            raise ValueError(f"target_p_l must be between 0.01 and 0.99 (got {target_p_l})")
        if not signature or len(signature.strip()) < 16:
            raise ValueError("Teacher cryptographic signature required for consequential override")
        if not rationale or len(rationale.strip()) < 10:
            raise ValueError("Substantive pedagogical rationale required for override")

        prev_pl = knowledge_state.current_p_l
        knowledge_state.current_p_l = target_p_l

        if target_p_l >= 0.85:
            knowledge_state.is_mastered = True
            knowledge_state.mastered_at = datetime.now(timezone.utc).isoformat()
        else:
            knowledge_state.is_mastered = False
            knowledge_state.mastered_at = None

        override_event = TeacherOverrideEvent(
            override_id=f"OVR-{len(self.override_history) + 1:04d}",
            teacher_id=teacher_id,
            student_id=knowledge_state.student_id,
            topic_id=knowledge_state.topic_id,
            action_type="SET_MASTERY_STATE",
            rationale=rationale,
            previous_value=prev_pl,
            new_value=target_p_l,
            signature=signature
        )

        self.override_history.append(override_event)
        return override_event

    def force_diagnostic(
        self,
        knowledge_state: TopicKnowledgeState,
        teacher_id: str,
        rationale: str,
        signature: str
    ) -> TeacherOverrideEvent:
        """
        Forces a student back into diagnostic mode.
        """
        if not signature or len(signature.strip()) < 16:
            raise ValueError("Teacher cryptographic signature required")

        prev_pl = knowledge_state.current_p_l
        knowledge_state.current_p_l = 0.15
        knowledge_state.is_mastered = False
        knowledge_state.consecutive_correct = 0

        override_event = TeacherOverrideEvent(
            override_id=f"OVR-{len(self.override_history) + 1:04d}",
            teacher_id=teacher_id,
            student_id=knowledge_state.student_id,
            topic_id=knowledge_state.topic_id,
            action_type="FORCE_DIAGNOSTIC",
            rationale=rationale,
            previous_value=prev_pl,
            new_value=0.15,
            signature=signature
        )

        self.override_history.append(override_event)
        return override_event
