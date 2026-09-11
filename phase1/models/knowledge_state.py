"""
Knowledge State Management
Tracks student mastery probability, attempt streaks, and verified mastery milestones.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any
from .bkt_engine import BktEngine, BktParameters


MASTERY_THRESHOLD = 0.85
MINIMUM_INDEPENDENT_CORRECT = 3


@dataclass
class AnswerAttempt:
    question_id: str
    is_correct: bool
    hint_used: bool
    response_time_seconds: float
    prior_p_l: float
    posterior_p_l: float
    next_p_l: float
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class TopicKnowledgeState:
    student_id: str
    topic_id: str
    competency_code: str
    current_p_l: float = 0.15
    is_mastered: bool = False
    mastered_at: str = None
    consecutive_correct: int = 0
    total_attempts: int = 0
    total_correct: int = 0
    attempts: List[AnswerAttempt] = field(default_factory=list)
    bkt_params: BktParameters = field(default_factory=BktParameters)

    def record_attempt(
        self,
        engine: BktEngine,
        question_id: str,
        is_correct: bool,
        hint_used: bool,
        response_time_seconds: float,
        item_params: BktParameters = None
    ) -> AnswerAttempt:
        prior = self.current_p_l
        posterior, next_pl = engine.update(
            current_p_l=prior,
            is_correct=is_correct,
            item_params=item_params or self.bkt_params
        )

        attempt = AnswerAttempt(
            question_id=question_id,
            is_correct=is_correct,
            hint_used=hint_used,
            response_time_seconds=response_time_seconds,
            prior_p_l=prior,
            posterior_p_l=posterior,
            next_p_l=next_pl
        )

        self.attempts.append(attempt)
        self.total_attempts += 1
        self.current_p_l = next_pl

        if is_correct and not hint_used:
            self.total_correct += 1
            self.consecutive_correct += 1
        else:
            self.consecutive_correct = 0

        # Verify mastery milestone
        if (
            self.current_p_l >= MASTERY_THRESHOLD
            and self.consecutive_correct >= MINIMUM_INDEPENDENT_CORRECT
            and not self.is_mastered
        ):
            self.is_mastered = True
            self.mastered_at = datetime.now(timezone.utc).isoformat()

        return attempt

    def to_dict(self) -> Dict[str, Any]:
        return {
            "studentId": self.student_id,
            "topicId": self.topic_id,
            "competencyCode": self.competency_code,
            "currentMasteryProbability": round(self.current_p_l, 4),
            "isMastered": self.is_mastered,
            "masteredAt": self.mastered_at,
            "consecutiveCorrect": self.consecutive_correct,
            "totalAttempts": self.total_attempts,
            "totalCorrect": self.total_correct,
            "attemptCount": len(self.attempts)
        }
