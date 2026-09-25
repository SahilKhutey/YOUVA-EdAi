"""
Unit and Adversarial Negative Tests for EarlyLearnerPolicyEngine, State Machine, and Review Queue
"""

import pytest
from phase6.models.early_learner_policy import (
    EarlyLearnerPolicyEngine,
    LearnerTier,
    LearnerTierPolicy,
    InteractionMode,
    TeacherOversightLevel,
    EarlyLearnerAIInteraction,
    ProhibitedInteraction,
    PolicyViolationError,
    AgeGatingError,
    HumanReviewQueueManager,
    ChildInteractionStateMachine,
    InteractionState,
    SessionParticipation
)
from phase6.models.parent_copilot import (
    ParentCopilotSession,
    SessionParticipationMode
)


@pytest.fixture
def engine():
    return EarlyLearnerPolicyEngine()


@pytest.fixture
def review_queue():
    return HumanReviewQueueManager()


# --- Age as Security/Policy Attribute Tests ---

def test_age_policy_allows_valid_band(engine):
    policy = engine.evaluate_age_tier(declared_age=8, requested_tier=LearnerTier.EARLY_LEARNER)
    assert policy.tier == LearnerTier.EARLY_LEARNER
    assert policy.minimumAge == 8
    assert policy.maximumAge == 10
    assert policy.freeTextAIEnabled is False
    assert policy.parentCopilotEnabled is True


def test_age_policy_blocks_underage_kindergarten(engine):
    """Underage children (e.g. 5yo kindergarten) cannot be imported into EARLY_LEARNER_V1."""
    with pytest.raises(AgeGatingError) as exc_info:
        engine.evaluate_age_tier(declared_age=5, requested_tier=LearnerTier.EARLY_LEARNER)
    assert "below Early Learner V1 boundary" in str(exc_info.value)
    assert "Kindergarten" in str(exc_info.value)


def test_age_policy_blocks_overage(engine):
    with pytest.raises(AgeGatingError) as exc_info:
        engine.evaluate_age_tier(declared_age=12, requested_tier=LearnerTier.EARLY_LEARNER)
    assert "exceeds Early Learner V1 boundary" in str(exc_info.value)


# --- AI Policy Boundary Tests ---

def test_approved_guided_interaction_allowed(engine):
    decision = engine.evaluate_ai_interaction(
        interaction_type=EarlyLearnerAIInteraction.GUIDED_QUESTION.value,
        content="Tap the number three.",
        is_free_text=False
    )
    assert decision.allowed is True
    assert decision.requiresHumanReview is False


def test_free_text_chat_unconditionally_blocked(engine):
    decision = engine.evaluate_ai_interaction(
        interaction_type="FREE_CHAT",
        content="Hello what is your favorite color?",
        is_free_text=True
    )
    assert decision.allowed is False
    assert "Free-text open chat is strictly prohibited" in decision.reason


def test_prohibited_ai_interaction_categories_blocked(engine):
    decision = engine.evaluate_ai_interaction(
        interaction_type=ProhibitedInteraction.EMOTIONAL_DEPENDENCY_PROMPT.value,
        content="I am your best friend forever.",
        is_free_text=False
    )
    assert decision.allowed is False
    assert decision.requiresHumanReview is True
    assert "Prohibited AI interaction category" in decision.reason


def test_personal_data_request_blocked(engine):
    decision = engine.evaluate_ai_interaction(
        interaction_type=EarlyLearnerAIInteraction.GUIDED_QUESTION.value,
        content="Where do you live?",
        is_free_text=False
    )
    assert decision.allowed is False
    assert decision.requiresHumanReview is True
    assert "prohibited pattern" in decision.reason


# --- Human Review Queue Invariant Tests ---

def test_human_review_queue_resolution(review_queue):
    item = review_queue.enqueue_review(
        session_id="sess_123",
        interaction_id="int_01",
        trigger="AMBIGUOUS_SPEECH",
        classification="UNRECOGNIZED_VOICE",
        recommendedAction="REPEAT_STATIC_AUDIO"
    )
    assert item.status == "OPEN"

    # Human teacher resolves
    resolved = review_queue.resolve_review(
        item_id=item.id,
        reviewer_id="tch_sharma_99",
        reviewer_role="Senior Teacher",
        resolution_notes="Audio clarity low; guided manually"
    )
    assert resolved.status == "RESOLVED"
    assert resolved.reviewerId == "tch_sharma_99"


def test_ai_strictly_forbidden_from_resolving_review(review_queue):
    item = review_queue.enqueue_review(
        session_id="sess_123",
        interaction_id="int_01",
        trigger="AMBIGUOUS_SPEECH",
        classification="UNRECOGNIZED_VOICE",
        recommendedAction="REPEAT_STATIC_AUDIO"
    )

    # Automated AI attempts to close item
    with pytest.raises(PolicyViolationError) as exc_info:
        review_queue.resolve_review(
            item_id=item.id,
            reviewer_id="ai_agent_v2",
            reviewer_role="ai_agent",
            resolution_notes="Auto resolved by LLM"
        )
    assert "AI agents are strictly forbidden" in str(exc_info.value)


# --- Child Interaction State Machine Tests ---

def test_deterministic_state_machine_flow():
    queue = HumanReviewQueueManager()
    sm = ChildInteractionStateMachine(session_id="sess_001", review_queue=queue)
    assert sm.state == InteractionState.SESSION_START

    sm.transition(InteractionState.WELCOME)
    sm.transition(InteractionState.INSTRUCTION)
    sm.transition(InteractionState.QUESTION)
    sm.transition(InteractionState.CHILD_RESPONSE)

    # Valid response -> Feedback
    next_state = sm.process_child_input(raw_input="3", is_ambiguous=False)
    assert next_state == InteractionState.FEEDBACK
    assert sm.state == InteractionState.FEEDBACK


def test_ambiguous_speech_routes_to_human_review_not_llm():
    queue = HumanReviewQueueManager()
    sm = ChildInteractionStateMachine(session_id="sess_002", review_queue=queue)
    sm.transition(InteractionState.WELCOME)
    sm.transition(InteractionState.INSTRUCTION)
    sm.transition(InteractionState.QUESTION)
    sm.transition(InteractionState.CHILD_RESPONSE)

    # Ambiguous response -> routes to HUMAN_REVIEW, never LLM guessing
    next_state = sm.process_child_input(raw_input="mumble...", is_ambiguous=True)
    assert next_state == InteractionState.HUMAN_REVIEW
    assert sm.state == InteractionState.HUMAN_REVIEW

    # Review item logged
    open_items = queue.get_open_items()
    assert len(open_items) == 1
    assert open_items[0].trigger == "AMBIGUOUS_SPEECH"


# --- Parent Co-Pilot Non-Surveillance Digest Tests ---

def test_parent_digest_omits_raw_bkt_and_error_percentages():
    session = ParentCopilotSession(
        session_id="sess_003",
        parent_token="parent_tok",
        child_token="child_tok",
        participation_mode=SessionParticipationMode.PARENT_ASSISTED.value
    )
    digest = session.generate_parent_digest(
        activities_completed=4,
        primary_topic="Counting to 10",
        needed_scaffolding=True
    )
    assert "P(L)" not in digest.summaryText
    assert "%" not in digest.summaryText
    assert "Enjoyed working together with gentle hints" in digest.summaryText
    assert digest.activitiesCompleted == 4
