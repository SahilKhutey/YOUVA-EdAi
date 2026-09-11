"""
YOUVA-EdAi: Parent Co-Pilot Model
Manages real-time parental observation, session gating, and co-play interaction for Junior Tier learners.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone


class ParentAction(str, Enum):
    PAUSE = "PAUSE"
    RESUME = "RESUME"
    TERMINATE = "TERMINATE"
    CO_PLAY_HINT_OFFERED = "CO_PLAY_HINT_OFFERED"


class SessionStateError(Exception):
    """Raised when an action is attempted on a terminated or invalid session."""
    pass


@dataclass
class ParentCopilotSession:
    session_id: str
    parent_token: str
    child_token: str
    start_time: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    max_duration_minutes: float = 15.0
    current_status: str = "ACTIVE"
    audio_transcripts: List[Dict[str, str]] = field(default_factory=list)
    parent_interventions: List[Dict[str, str]] = field(default_factory=list)

    def record_prompt_delivered(
        self,
        prompt_id: str,
        spoken_text: str,
        child_response: str
    ) -> None:
        """Log real-time audio interaction visible to parent."""
        if self.current_status != "ACTIVE":
            raise SessionStateError(f"Cannot deliver prompt to non-active session ({self.current_status}).")

        self.audio_transcripts.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "promptId": prompt_id,
            "spokenText": spoken_text,
            "childResponse": child_response
        })

    def pause_session(self, reason: str = "Parent requested pause") -> str:
        """Unilateral parental pause."""
        if self.current_status == "TERMINATED_BY_PARENT":
            raise SessionStateError("Session is already terminated.")

        self.current_status = "PAUSED_BY_PARENT"
        self.parent_interventions.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": ParentAction.PAUSE.value,
            "notes": reason
        })
        return self.current_status

    def resume_session(self) -> str:
        """Resume session from pause."""
        if self.current_status != "PAUSED_BY_PARENT":
            raise SessionStateError(f"Cannot resume session with status '{self.current_status}'.")

        self.current_status = "ACTIVE"
        self.parent_interventions.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": ParentAction.RESUME.value,
            "notes": "Parent resumed session"
        })
        return self.current_status

    def terminate_session(self, reason: str = "Parent terminated session") -> str:
        """Unilateral parental kill switch."""
        self.current_status = "TERMINATED_BY_PARENT"
        self.parent_interventions.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": ParentAction.TERMINATE.value,
            "notes": reason
        })
        return self.current_status

    def offer_co_play_hint(self, hint_text: str) -> None:
        """Parent sends a supportive co-play prompt to assist their child."""
        if self.current_status != "ACTIVE":
            raise SessionStateError("Cannot deliver co-play hint to inactive session.")

        self.parent_interventions.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": ParentAction.CO_PLAY_HINT_OFFERED.value,
            "notes": hint_text
        })

    def check_time_limit(self, elapsed_minutes: float) -> str:
        """Enforce 15-minute hard limit automatically."""
        if elapsed_minutes >= self.max_duration_minutes:
            self.current_status = "AUTO_STOPPED_TIME_LIMIT"
        return self.current_status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sessionId": self.session_id,
            "parentToken": self.parent_token,
            "childToken": self.child_token,
            "startTime": self.start_time,
            "maxDurationMinutes": int(self.max_duration_minutes),
            "currentStatus": self.current_status,
            "audioTranscripts": list(self.audio_transcripts),
            "parentInterventions": list(self.parent_interventions)
        }
