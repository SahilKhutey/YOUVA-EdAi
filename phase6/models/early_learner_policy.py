"""
YOUVA-EdAi: Early Learner Policy Engine & Constrained Execution Environment
Enforces server-side policy invariants for early childhood and primary learners:
  1. Age as a Security/Policy Attribute: Enforces strict age gating server-side.
  2. Non-homogeneous tiering: Defines EARLY_LEARNER_V1 as a locked initial band (Ages 8-10 / Grades 3-4),
     preventing accidental expansion into preschool/kindergarten (ages 4-6) without separate review.
  3. Prohibited AI Behaviors: Hard blocking of free-text chat, open-ended generation, and emotional companions.
  4. Deterministic Interaction State Machine: Ambiguous speech routes to human review / static fallback, never LLM guessing.
  5. Audio Minimization: Zero raw audio persistence, minimized ephemeral transcripts.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from datetime import datetime, timezone
import uuid


class LearnerTier(str, Enum):
    EARLY_LEARNER = "EARLY_LEARNER"
    MIDDLE_SCHOOL = "MIDDLE_SCHOOL"
    HIGH_SCHOOL = "HIGH_SCHOOL"


class InteractionMode(str, Enum):
    TEXT = "TEXT"
    VOICE_TAP = "VOICE_TAP"
    VOICE_TAP_GUIDED = "VOICE_TAP_GUIDED"


class TeacherOversightLevel(str, Enum):
    FREQUENT = "FREQUENT"
    MILESTONE = "MILESTONE"


class SessionParticipation(str, Enum):
    CHILD_ONLY = "CHILD_ONLY"
    PARENT_ASSISTED = "PARENT_ASSISTED"
    TEACHER_SUPERVISED = "TEACHER_SUPERVISED"


class InteractionState(str, Enum):
    SESSION_START = "SESSION_START"
    WELCOME = "WELCOME"
    INSTRUCTION = "INSTRUCTION"
    QUESTION = "QUESTION"
    CHILD_RESPONSE = "CHILD_RESPONSE"
    VALIDATION = "VALIDATION"
    FEEDBACK = "FEEDBACK"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    NEXT_ACTIVITY = "NEXT_ACTIVITY"
    SESSION_COMPLETE = "SESSION_COMPLETE"


class EarlyLearnerAIInteraction(str, Enum):
    GUIDED_QUESTION = "GUIDED_QUESTION"
    STRUCTURED_ANSWER = "STRUCTURED_ANSWER"
    ENCOURAGEMENT = "ENCOURAGEMENT"
    HINT = "HINT"
    REPEAT_INSTRUCTION = "REPEAT_INSTRUCTION"
    CLARIFICATION = "CLARIFICATION"
    HUMAN_HANDOFF = "HUMAN_HANDOFF"


class ProhibitedInteraction(str, Enum):
    OPEN_CHAT = "OPEN_CHAT"
    UNSTRUCTURED_ADVICE = "UNSTRUCTURED_ADVICE"
    PERSONAL_DATA_REQUEST = "PERSONAL_DATA_REQUEST"
    OFF_TOPIC_CONVERSATION = "OFF_TOPIC_CONVERSATION"
    EMOTIONAL_DEPENDENCY_PROMPT = "EMOTIONAL_DEPENDENCY_PROMPT"
    ROLEPLAY_OUTSIDE_APPROVED_CONTENT = "ROLEPLAY_OUTSIDE_APPROVED_CONTENT"
    UNAPPROVED_EXTERNAL_ACTION = "UNAPPROVED_EXTERNAL_ACTION"


class PolicyViolationError(Exception):
    """Raised when an interaction or parameter violates Early Learner policy boundaries."""
    pass


class AgeGatingError(Exception):
    """Raised when a learner's age falls outside the locked policy band."""
    pass


@dataclass(frozen=True)
class LearnerTierPolicy:
    tier: LearnerTier
    minimumAge: int
    maximumAge: int
    interactionMode: InteractionMode
    freeTextAIEnabled: bool
    parentCopilotEnabled: bool
    teacherOversight: TeacherOversightLevel
    humanReviewRequiredForAmbiguousAI: bool


# Canonical Tier Policy Definitions
TIER_POLICIES: Dict[LearnerTier, LearnerTierPolicy] = {
    LearnerTier.EARLY_LEARNER: LearnerTierPolicy(
        tier=LearnerTier.EARLY_LEARNER,
        minimumAge=8,
        maximumAge=10,
        interactionMode=InteractionMode.VOICE_TAP_GUIDED,
        freeTextAIEnabled=False,
        parentCopilotEnabled=True,
        teacherOversight=TeacherOversightLevel.FREQUENT,
        humanReviewRequiredForAmbiguousAI=True,
    ),
    LearnerTier.MIDDLE_SCHOOL: LearnerTierPolicy(
        tier=LearnerTier.MIDDLE_SCHOOL,
        minimumAge=11,
        maximumAge=13,
        interactionMode=InteractionMode.TEXT,
        freeTextAIEnabled=True,
        parentCopilotEnabled=False,
        teacherOversight=TeacherOversightLevel.FREQUENT,
        humanReviewRequiredForAmbiguousAI=False,
    ),
    LearnerTier.HIGH_SCHOOL: LearnerTierPolicy(
        tier=LearnerTier.HIGH_SCHOOL,
        minimumAge=14,
        maximumAge=18,
        interactionMode=InteractionMode.TEXT,
        freeTextAIEnabled=True,
        parentCopilotEnabled=False,
        teacherOversight=TeacherOversightLevel.MILESTONE,
        humanReviewRequiredForAmbiguousAI=False,
    )
}


@dataclass
class EarlyLearnerPolicy:
    tier: str = "EARLY_LEARNER"
    scopeBand: str = "EARLY_LEARNER_V1"  # Locked to Ages 8-10 / Grades 3-4
    voiceInput: bool = True
    voiceOutput: bool = True
    tapInteraction: bool = True
    freeTextChat: bool = False
    generativeOpenEndedResponses: bool = False
    structuredResponsesOnly: bool = True
    humanReviewOnAmbiguity: bool = True
    parentCopilot: bool = True
    shortSessions: bool = True
    maximumSessionMinutes: float = 15.0
    requireGuardianConsent: bool = True
    # Voice Data Minimization Invariants
    retainRawAudio: bool = False
    retainEphemeralTranscriptsOnly: bool = True


@dataclass
class AIPolicyDecision:
    allowed: bool
    interactionType: str
    requiresHumanReview: bool
    reason: str
    policyVersion: str = "1.0.0-phase6"


@dataclass
class AIReviewItem:
    id: str
    studentSessionId: str
    interactionId: str
    trigger: str  # "AMBIGUOUS_SPEECH" | "POLICY_BLOCK" | "CONTENT_FILTER" | "SAFETY_SIGNAL" | "SYSTEM_ERROR"
    inputClassification: str
    recommendedAction: str
    status: str = "OPEN"  # "OPEN" | "ACKNOWLEDGED" | "REVIEWED" | "RESOLVED"
    reviewerId: Optional[str] = None
    createdAt: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolvedAt: Optional[str] = None
    resolutionNotes: Optional[str] = None


class EarlyLearnerPolicyEngine:
    """
    Authoritative server-side policy evaluator for Early Learner interactions.
    Blocks any attempt by frontend or client agents to bypass safety invariants.
    """

    def __init__(self, policy: Optional[EarlyLearnerPolicy] = None):
        self.policy = policy or EarlyLearnerPolicy()
        self.prohibited_keywords: Set[str] = {
            "tell me a secret", "where do you live", "what is your phone",
            "are you my friend", "i love you", "do you love me",
            "chat with me", "ignore previous instructions", "system prompt"
        }

    def evaluate_age_tier(self, declared_age: int, requested_tier: LearnerTier) -> LearnerTierPolicy:
        """Enforces age as a security/policy attribute."""
        if requested_tier not in TIER_POLICIES:
            raise PolicyViolationError(f"Unknown tier: {requested_tier}")

        tier_policy = TIER_POLICIES[requested_tier]

        if requested_tier == LearnerTier.EARLY_LEARNER:
            if declared_age < tier_policy.minimumAge:
                raise AgeGatingError(
                    f"Age {declared_age} is below Early Learner V1 boundary ({tier_policy.minimumAge}-"
                    f"{tier_policy.maximumAge}). Kindergarten (ages 4-7) is explicitly OUT OF SCOPE for V1."
                )
            if declared_age > tier_policy.maximumAge:
                raise AgeGatingError(
                    f"Age {declared_age} exceeds Early Learner V1 boundary. Student must be routed to MIDDLE_SCHOOL."
                )

        return tier_policy

    def evaluate_ai_interaction(
        self,
        interaction_type: str,
        content: str,
        is_free_text: bool = False
    ) -> AIPolicyDecision:
        """Validates proposed AI interaction against hard safety boundaries."""
        # 1. Block free-text interactions unconditionally
        if is_free_text or not self.policy.structuredResponsesOnly:
            return AIPolicyDecision(
                allowed=False,
                interactionType=interaction_type,
                requiresHumanReview=False,
                reason="Free-text open chat is strictly prohibited in Early Learner tier."
            )

        # 2. Check for prohibited interaction classifications
        if interaction_type in [p.value for p in ProhibitedInteraction]:
            return AIPolicyDecision(
                allowed=False,
                interactionType=interaction_type,
                requiresHumanReview=True,
                reason=f"Prohibited AI interaction category: {interaction_type}"
            )

        # 3. Check content for prohibited keywords or privacy traps
        lowered = content.lower()
        for kw in self.prohibited_keywords:
            if kw in lowered:
                return AIPolicyDecision(
                    allowed=False,
                    interactionType=interaction_type,
                    requiresHumanReview=True,
                    reason=f"Content contains prohibited pattern: '{kw}'"
                )

        # 4. Enforce approved interaction types
        if interaction_type not in [a.value for a in EarlyLearnerAIInteraction]:
            return AIPolicyDecision(
                allowed=False,
                interactionType=interaction_type,
                requiresHumanReview=True,
                reason=f"Unrecognized interaction type '{interaction_type}'."
            )

        return AIPolicyDecision(
            allowed=True,
            interactionType=interaction_type,
            requiresHumanReview=False,
            reason="Interaction adheres to certified Early Learner structured templates."
        )


class HumanReviewQueueManager:
    """
    Manages human review items for ambiguous or blocked early learner interactions.
    Enforces invariant: AI CANNOT resolve review items.
    """

    def __init__(self):
        self._items: Dict[str, AIReviewItem] = {}

    def enqueue_review(
        self,
        session_id: str,
        interaction_id: str,
        trigger: str,
        classification: str,
        recommended_action: str = "",
        recommendedAction: Optional[str] = None
    ) -> AIReviewItem:
        action = recommendedAction or recommended_action or "HUMAN_EVALUATION"
        item_id = f"rev_{uuid.uuid4().hex[:12]}"
        item = AIReviewItem(
            id=item_id,
            studentSessionId=session_id,
            interactionId=interaction_id,
            trigger=trigger,
            inputClassification=classification,
            recommendedAction=action,
        )
        self._items[item_id] = item
        return item

    def resolve_review(
        self,
        item_id: str,
        reviewer_id: str,
        reviewer_role: str,
        resolution_notes: str
    ) -> AIReviewItem:
        """Resolve a review item. Only human teachers / safety officers can resolve."""
        if item_id not in self._items:
            raise KeyError(f"Review item {item_id} not found.")

        if reviewer_role.lower() in ["ai", "ai_agent", "automated", "bot"]:
            raise PolicyViolationError("AI agents are strictly forbidden from resolving human review queue items.")

        item = self._items[item_id]
        item.status = "RESOLVED"
        item.reviewerId = reviewer_id
        item.resolvedAt = datetime.now(timezone.utc).isoformat()
        item.resolutionNotes = resolution_notes
        return item

    def get_open_items(self) -> List[AIReviewItem]:
        return [i for i in self._items.values() if i.status == "OPEN"]


class ChildInteractionStateMachine:
    """
    Deterministic interaction state machine for early childhood sessions.
    Guarantees that ambiguous input never falls back to generative LLM guessing.
    """

    def __init__(self, session_id: str, review_queue: Optional[HumanReviewQueueManager] = None):
        self.session_id = session_id
        self.state: InteractionState = InteractionState.SESSION_START
        self.review_queue = review_queue or HumanReviewQueueManager()
        self.current_activity_id: Optional[str] = None
        self.history: List[InteractionState] = [self.state]

    def transition(self, target_state: InteractionState) -> InteractionState:
        valid_transitions = {
            InteractionState.SESSION_START: [InteractionState.WELCOME],
            InteractionState.WELCOME: [InteractionState.INSTRUCTION],
            InteractionState.INSTRUCTION: [InteractionState.QUESTION],
            InteractionState.QUESTION: [InteractionState.CHILD_RESPONSE],
            InteractionState.CHILD_RESPONSE: [InteractionState.VALIDATION],
            InteractionState.VALIDATION: [InteractionState.FEEDBACK, InteractionState.HUMAN_REVIEW],
            InteractionState.FEEDBACK: [InteractionState.NEXT_ACTIVITY, InteractionState.SESSION_COMPLETE],
            InteractionState.HUMAN_REVIEW: [InteractionState.FEEDBACK, InteractionState.NEXT_ACTIVITY, InteractionState.SESSION_COMPLETE],
            InteractionState.NEXT_ACTIVITY: [InteractionState.INSTRUCTION, InteractionState.QUESTION, InteractionState.SESSION_COMPLETE],
            InteractionState.SESSION_COMPLETE: []
        }

        allowed = valid_transitions.get(self.state, [])
        if target_state not in allowed:
            raise PolicyViolationError(
                f"Invalid state transition from {self.state} to {target_state}."
            )

        self.state = target_state
        self.history.append(self.state)
        return self.state

    def process_child_input(self, raw_input: str, is_ambiguous: bool) -> InteractionState:
        """
        Processes child voice or tap response.
        If ambiguous, routes immediately to static approved fallback / human review.
        """
        self.transition(InteractionState.VALIDATION)

        if is_ambiguous:
            # Route to human review queue and approved static clarification fallback
            self.review_queue.enqueue_review(
                session_id=self.session_id,
                interaction_id=f"int_{len(self.history)}",
                trigger="AMBIGUOUS_SPEECH",
                classification="CHILD_SPEECH_UNRECOGNIZED",
                recommendedAction="PLAY_STATIC_REPEAT_INSTRUCTION_AUDIO"
            )
            return self.transition(InteractionState.HUMAN_REVIEW)

        return self.transition(InteractionState.FEEDBACK)
