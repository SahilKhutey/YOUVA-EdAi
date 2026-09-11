"""
YOUVA-EdAi: Adolescent High School UX State Manager
Manages mature, telemetry-driven UI state tailored for secondary school learners (ages 14-16).
Replaces juvenile gamification (cartoon characters, confetti, coin economies)
with analytical telemetry: learning velocity, concept readiness radar, and credential passports.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import math


@dataclass
class AdolescentUXProfile:
    student_did: str
    grade: str = "Grade 10"
    learning_velocity: float = 0.0          # delta P(L) per hour of deliberate practice
    readiness_radar: Dict[str, float] = field(default_factory=dict)
    active_goals: List[str] = field(default_factory=list)
    earned_credentials: List[str] = field(default_factory=list)
    # Anti-gamification invariants
    has_cartoon_avatars: bool = False
    has_confetti_effects: bool = False
    has_arbitrary_points: bool = False


class AdolescentUXManager:
    """
    Controller for High School Student Dashboard.
    Focuses on student agency, metacognitive self-regulation, and analytical mastery indicators.
    """

    def __init__(self):
        self._profiles: Dict[str, AdolescentUXProfile] = {}

    def get_or_create_profile(self, student_did: str) -> AdolescentUXProfile:
        if student_did not in self._profiles:
            self._profiles[student_did] = AdolescentUXProfile(student_did=student_did)
        return self._profiles[student_did]

    def calculate_learning_velocity(
        self,
        initial_p_l: float,
        final_p_l: float,
        time_spent_minutes: float
    ) -> float:
        """
        Compute empirical learning velocity:
        Velocity = (P(L_final) - P(L_initial)) / (time_spent_hours)
        """
        if time_spent_minutes <= 0:
            return 0.0
        hours = time_spent_minutes / 60.0
        delta = max(0.0, final_p_l - initial_p_l)
        return round(delta / hours, 3)

    def update_readiness_radar(
        self,
        student_did: str,
        concept_masteries: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Normalize concept probabilities into a [0.0 - 1.0] readiness radar profile.
        """
        profile = self.get_or_create_profile(student_did)
        profile.readiness_radar = {
            cid: round(min(1.0, max(0.0, p)), 2)
            for cid, p in concept_masteries.items()
        }
        return profile.readiness_radar

    def add_student_goal(self, student_did: str, goal: str) -> List[str]:
        profile = self.get_or_create_profile(student_did)
        if goal not in profile.active_goals:
            profile.active_goals.append(goal)
        return profile.active_goals

    def record_earned_credential(self, student_did: str, credential_id: str) -> List[str]:
        profile = self.get_or_create_profile(student_did)
        if credential_id not in profile.earned_credentials:
            profile.earned_credentials.append(credential_id)
        return profile.earned_credentials
