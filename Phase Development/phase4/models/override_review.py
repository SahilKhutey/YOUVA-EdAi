"""
YOUVA-EdAi: Educator Override Pattern Review & Calibration Loop
Analyzes teacher override decisions to identify systemic psychometric miscalibrations,
concept difficulty discrepancies, and provide closed-loop pedagogical insights.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from collections import Counter


@dataclass(frozen=True)
class OverrideEvent:
    override_id: str
    teacher_id: str
    student_id: str
    concept_id: str
    ai_recommendation: Dict[str, Any]
    teacher_decision: Dict[str, Any]
    reason_category: str  # DIFFICULTY_TOO_HIGH, DIFFICULTY_TOO_LOW, PACING_ALIGNMENT, STUDENT_ANXIETY, OTHER
    reason_notes: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    post_override_outcome: Optional[Dict[str, Any]] = None  # e.g., {"mastered": True, "final_p": 0.88}


@dataclass(frozen=True)
class CalibrationRecommendation:
    concept_id: str
    issue_detected: str
    recommended_adjustment: str
    confidence: float
    supporting_override_count: int


@dataclass(frozen=True)
class OverridePatternReport:
    total_overrides: int
    overrides_by_concept: Dict[str, int]
    overrides_by_reason: Dict[str, int]
    calibration_recommendations: List[CalibrationRecommendation]
    teacher_agreement_rate: float


class TeacherOverrideReviewer:
    """
    Continuous calibration engine that audits educator overrides.
    Maintains the human-in-the-loop invariant by learning from teacher expertise.
    """

    REASON_CATEGORIES = [
        "DIFFICULTY_TOO_HIGH",
        "DIFFICULTY_TOO_LOW",
        "PACING_ALIGNMENT",
        "STUDENT_ANXIETY",
        "OTHER"
    ]

    def __init__(self, override_threshold_for_calibration: int = 3):
        self._events: List[OverrideEvent] = []
        self._total_ai_recommendations: int = 0
        self.calibration_threshold = override_threshold_for_calibration

    def record_recommendation_served(self) -> None:
        """Track total AI recommendations served to compute override rate."""
        self._total_ai_recommendations += 1

    def record_override(self, event: OverrideEvent) -> None:
        """Log a teacher override event."""
        if event.reason_category not in self.REASON_CATEGORIES:
            raise ValueError(f"Invalid reason category '{event.reason_category}'. Must be one of {self.REASON_CATEGORIES}")
        self._events.append(event)

    def analyze_patterns(self) -> OverridePatternReport:
        """
        Aggregate override patterns and generate psychometric calibration recommendations.
        """
        total_overrides = len(self._events)
        concept_counter = Counter(e.concept_id for e in self._events)
        reason_counter = Counter(e.reason_category for e in self._events)

        recommendations: List[CalibrationRecommendation] = []

        for concept_id, count in concept_counter.items():
            if count >= self.calibration_threshold:
                # Analyze dominant reason for this concept
                concept_reasons = [e.reason_category for e in self._events if e.concept_id == concept_id]
                dominant_reason, dominant_count = Counter(concept_reasons).most_common(1)[0]

                if dominant_reason == "DIFFICULTY_TOO_HIGH":
                    recommendations.append(CalibrationRecommendation(
                        concept_id=concept_id,
                        issue_detected=f"Teachers repeatedly reduced difficulty ({dominant_count}/{count} overrides)",
                        recommended_adjustment="Lower base difficulty band or increase initial slip tolerance (P_S). Provide extra Tier 1 scaffolding.",
                        confidence=min(0.95, round(dominant_count / count, 2)),
                        supporting_override_count=dominant_count
                    ))
                elif dominant_reason == "DIFFICULTY_TOO_LOW":
                    recommendations.append(CalibrationRecommendation(
                        concept_id=concept_id,
                        issue_detected=f"Teachers repeatedly escalated difficulty ({dominant_count}/{count} overrides)",
                        recommended_adjustment="Raise concept baseline difficulty or accelerate transition probability (P_T).",
                        confidence=min(0.95, round(dominant_count / count, 2)),
                        supporting_override_count=dominant_count
                    ))
                elif dominant_reason == "PACING_ALIGNMENT":
                    recommendations.append(CalibrationRecommendation(
                        concept_id=concept_id,
                        issue_detected=f"Pacing mismatch with classroom lesson calendar ({dominant_count}/{count} overrides)",
                        recommended_adjustment="Synchronize adaptive sequence with teacher's published weekly syllabus milestones.",
                        confidence=min(0.95, round(dominant_count / count, 2)),
                        supporting_override_count=dominant_count
                    ))

        agreement_rate = 1.0
        if self._total_ai_recommendations > 0:
            agreement_rate = max(0.0, 1.0 - (total_overrides / self._total_ai_recommendations))

        return OverridePatternReport(
            total_overrides=total_overrides,
            overrides_by_concept=dict(concept_counter),
            overrides_by_reason=dict(reason_counter),
            calibration_recommendations=recommendations,
            teacher_agreement_rate=round(agreement_rate, 4)
        )
