"""
YOUVA-EdAi Phase 5: High School Expansion Models
Includes Skills Passport W3C VC 2.0 Engine, Adolescent UX Manager, and Pilot Evaluator.
"""

from .skills_passport import (
    SkillsPassportEngine,
    HumanAuthorizationRequiredError,
    ZeroPIIViolationError,
    AntiGamingPolicyViolationError
)
from .highschool_ux_state import AdolescentUXManager, AdolescentUXProfile
from .pilot_evaluator import HighSchoolPilotEvaluator

__all__ = [
    "SkillsPassportEngine",
    "HumanAuthorizationRequiredError",
    "ZeroPIIViolationError",
    "AntiGamingPolicyViolationError",
    "AdolescentUXManager",
    "AdolescentUXProfile",
    "HighSchoolPilotEvaluator"
]
