import pytest
from pathlib import Path
from phase1.models.bkt_engine import BktEngine
from phase1.models.knowledge_state import TopicKnowledgeState
from phase1.models.item_selector import AdaptiveItemSelector
import json

CONTENT_DIR = Path(__file__).resolve().parents[1] / "content"


@pytest.fixture
def question_bank():
    with (CONTENT_DIR / "grade8_linear_equations_bank.json").open("r", encoding="utf-8") as f:
        return json.load(f)["questions"]


def test_adaptive_selection_targets_zpd(question_bank):
    """Adaptive selector should pick items suitable for current knowledge state."""
    engine = BktEngine()
    selector = AdaptiveItemSelector(engine)

    state_low = TopicKnowledgeState(
        student_id="s1",
        topic_id="linear_eq",
        competency_code="MATH-G8-ALG-01",
        current_p_l=0.15
    )

    selected = selector.select_next_item(state_low, question_bank)
    assert selected is not None
    assert "questionId" in selected


def test_anti_repetition_guard(question_bank):
    """Selector must not immediately repeat a question in recent_question_ids."""
    engine = BktEngine()
    selector = AdaptiveItemSelector(engine)

    state = TopicKnowledgeState(
        student_id="s1",
        topic_id="linear_eq",
        competency_code="MATH-G8-ALG-01",
        current_p_l=0.50
    )

    first_item = selector.select_next_item(state, question_bank, recent_question_ids=[])
    recent = [first_item["questionId"]]

    second_item = selector.select_next_item(state, question_bank, recent_question_ids=recent)
    assert second_item["questionId"] != first_item["questionId"]
