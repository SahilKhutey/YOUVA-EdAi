"""
YOUVA-EdAI — Phase 3: Privacy-Preserving Pedagogical Telemetry Collector.
Captures student formative interactions, latency, hint expansions,
and teacher routing-around / friction indicators without logging PII.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import hashlib
from typing import Dict, List, Optional
import uuid


class TelemetryEventType(str, Enum):
    PRACTICE_ITEM_PRESENTED = "PRACTICE_ITEM_PRESENTED"
    PRACTICE_ITEM_ANSWERED = "PRACTICE_ITEM_ANSWERED"
    HINT_REQUESTED = "HINT_REQUESTED"
    STEP_EXPANSION_VIEWED = "STEP_EXPANSION_VIEWED"
    TEACHER_OVERRIDE_EXECUTED = "TEACHER_OVERRIDE_EXECUTED"
    TEACHER_BYPASS_DETECTED = "TEACHER_BYPASS_DETECTED"
    SESSION_COMPLETED = "SESSION_COMPLETED"


@dataclass
class TelemetryEvent:
    event_id: str
    timestamp: datetime
    event_type: TelemetryEventType
    session_id: str
    cohort_id: str
    pseudonymized_student_id: str
    payload: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "eventId": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "eventType": self.event_type.value,
            "sessionId": self.session_id,
            "cohortId": self.cohort_id,
            "pseudonymizedStudentId": self.pseudonymized_student_id,
            "payload": self.payload,
        }


class PilotTelemetryCollector:
    """
    Collects minimal-necessary privacy-preserving telemetry for Phase 3 classroom pilots.
    Applies cryptographic one-way pseudonymization to avoid student PII exposure.
    """

    def __init__(self, cohort_id: str = "PILOT-DPS-RKP-2026-Q3", salt: str = "youva-pilot-telemetry-salt-2026"):
        self.cohort_id = cohort_id
        self.salt = salt.encode("utf-8")
        self.events: List[TelemetryEvent] = []

    def pseudonymize_student(self, student_id: str) -> str:
        """Computes deterministic 12-char pseudonym token: anon_<hash>."""
        raw = self.salt + student_id.encode("utf-8")
        digest = hashlib.sha256(raw).hexdigest()[:12]
        return f"anon_{digest}"

    def record_item_answered(
        self,
        session_id: str,
        student_id: str,
        topic_id: str,
        question_id: str,
        is_correct: bool,
        latency_ms: int,
        prior_mastery: float,
        posterior_mastery: float,
        timestamp: Optional[datetime] = None,
    ) -> TelemetryEvent:
        """Records a completed practice item trial."""
        event = TelemetryEvent(
            event_id=f"tel-{uuid.uuid4().hex[:12]}",
            timestamp=timestamp or datetime.now(timezone.utc),
            event_type=TelemetryEventType.PRACTICE_ITEM_ANSWERED,
            session_id=session_id,
            cohort_id=self.cohort_id,
            pseudonymized_student_id=self.pseudonymize_student(student_id),
            payload={
                "topicId": topic_id,
                "questionId": question_id,
                "isCorrect": is_correct,
                "latencyMs": latency_ms,
                "priorMastery": round(prior_mastery, 4),
                "posteriorMastery": round(posterior_mastery, 4),
            },
        )
        self.events.append(event)
        return event

    def record_hint_requested(
        self,
        session_id: str,
        student_id: str,
        topic_id: str,
        question_id: str,
        hint_index: int,
        timestamp: Optional[datetime] = None,
    ) -> TelemetryEvent:
        """Records a learner requesting a pedagogical hint."""
        event = TelemetryEvent(
            event_id=f"tel-{uuid.uuid4().hex[:12]}",
            timestamp=timestamp or datetime.now(timezone.utc),
            event_type=TelemetryEventType.HINT_REQUESTED,
            session_id=session_id,
            cohort_id=self.cohort_id,
            pseudonymized_student_id=self.pseudonymize_student(student_id),
            payload={
                "topicId": topic_id,
                "questionId": question_id,
                "hintIndex": hint_index,
            },
        )
        self.events.append(event)
        return event

    def record_teacher_override(
        self,
        session_id: str,
        student_id: str,
        topic_id: str,
        override_type: str,
        timestamp: Optional[datetime] = None,
    ) -> TelemetryEvent:
        """Records an educator modifying an AI recommendation."""
        event = TelemetryEvent(
            event_id=f"tel-{uuid.uuid4().hex[:12]}",
            timestamp=timestamp or datetime.now(timezone.utc),
            event_type=TelemetryEventType.TEACHER_OVERRIDE_EXECUTED,
            session_id=session_id,
            cohort_id=self.cohort_id,
            pseudonymized_student_id=self.pseudonymize_student(student_id),
            payload={
                "topicId": topic_id,
                "teacherOverrideType": override_type,
            },
        )
        self.events.append(event)
        return event

    def record_teacher_bypass(
        self,
        session_id: str,
        student_id: str,
        topic_id: str,
        reason: str,
        timestamp: Optional[datetime] = None,
    ) -> TelemetryEvent:
        """
        Records an educator routing around the platform (e.g. resorting to paper worksheets
        or external portals due to system friction).
        """
        event = TelemetryEvent(
            event_id=f"tel-{uuid.uuid4().hex[:12]}",
            timestamp=timestamp or datetime.now(timezone.utc),
            event_type=TelemetryEventType.TEACHER_BYPASS_DETECTED,
            session_id=session_id,
            cohort_id=self.cohort_id,
            pseudonymized_student_id=self.pseudonymize_student(student_id),
            payload={
                "topicId": topic_id,
                "bypassReason": reason,
            },
        )
        self.events.append(event)
        return event

    def get_events(self) -> List[TelemetryEvent]:
        return list(self.events)

    def calculate_routing_around_rate(self) -> float:
        """
        Calculates the teacher routing-around / bypass rate:
        bypass_events / (practice_trials + bypass_events)
        Target: < 5.0%
        """
        bypass_count = sum(1 for e in self.events if e.event_type == TelemetryEventType.TEACHER_BYPASS_DETECTED)
        trial_count = sum(1 for e in self.events if e.event_type == TelemetryEventType.PRACTICE_ITEM_ANSWERED)
        total_interactions = trial_count + bypass_count
        if total_interactions == 0:
            return 0.0
        return round(bypass_count / total_interactions, 4)
