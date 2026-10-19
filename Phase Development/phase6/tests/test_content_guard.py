"""
Unit tests for EarlyChildhoodContentGuard
"""

import pytest
from phase6.models.content_guard import (
    EarlyChildhoodContentGuard,
    ContentConstraintViolation,
    ScreenTimeLimitExceededError
)


@pytest.fixture
def guard():
    return EarlyChildhoodContentGuard()


def test_valid_prompts(guard):
    assert guard.validate_prompt("Tap the three red apples.") is True
    assert guard.validate_prompt("Find the number two.") is True
    assert guard.validate_prompt("Tap the big circle.") is True
    assert guard.validate_prompt("Which word rhymes with cat?") is True


def test_empty_prompt_rejected(guard):
    with pytest.raises(ContentConstraintViolation):
        guard.validate_prompt("")


def test_sentence_length_limit(guard):
    # 9 words > 8 max
    with pytest.raises(ContentConstraintViolation) as exc:
        guard.validate_prompt("One two three four five six seven eight nine")
    assert "exceeds" in str(exc.value)


def test_uncertified_vocabulary_rejected(guard):
    with pytest.raises(ContentConstraintViolation) as exc:
        guard.validate_prompt("Analyze the polynomial expression.")
    assert "certified early childhood vocabulary" in str(exc.value)


def test_dark_patterns_rejected(guard):
    patterns = [
        "Hurry! Time is ticking!",
        "Don't lose your streak today!",
        "Buy more diamonds to win!",
        "You failed this question!"
    ]
    for p in patterns:
        with pytest.raises(ContentConstraintViolation):
            guard.validate_prompt(p)


def test_complex_punctuation_rejected(guard):
    with pytest.raises(ContentConstraintViolation):
        guard.validate_prompt("Tap circle; find square.")


def test_screen_time_limit_enforced(guard):
    assert guard.check_session_duration(14.5) is True
    assert guard.check_session_duration(15.0) is True

    with pytest.raises(ScreenTimeLimitExceededError) as exc:
        guard.check_session_duration(15.1)
    assert "15-minute maximum limit" in str(exc.value)
