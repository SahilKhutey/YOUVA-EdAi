import pytest
from phase1.models.bkt_engine import BktEngine, BktParameters


def test_bkt_parameter_validation():
    """Parameters must be bounded in [0, 1] and non-degenerate."""
    # Valid
    params = BktParameters(p_l0=0.2, p_t=0.1, p_g=0.25, p_s=0.1)
    assert params.p_l0 == 0.2

    # Out of range
    with pytest.raises(ValueError):
        BktParameters(p_l0=-0.1)

    # Degenerate: P(G) >= 1 - P(S) (guessing is more reliable than knowing!)
    with pytest.raises(ValueError, match="Degenerate parameters"):
        BktParameters(p_g=0.6, p_s=0.5)


def test_bkt_correct_increases_mastery():
    """Answering correctly must strictly increase the knowledge probability."""
    engine = BktEngine()
    initial_p = 0.40
    post, next_p = engine.update(current_p_l=initial_p, is_correct=True)
    assert post > initial_p
    assert next_p > post


def test_bkt_incorrect_decreases_mastery():
    """Answering incorrectly must decrease the knowledge probability."""
    engine = BktEngine()
    initial_p = 0.70
    post, next_p = engine.update(current_p_l=initial_p, is_correct=False)
    assert post < initial_p


def test_bkt_consecutive_correct_converges():
    """Consecutive correct answers should asymptotically converge towards 0.999."""
    engine = BktEngine()
    p = 0.10
    for _ in range(10):
        _, p = engine.update(p, is_correct=True)
    assert p > 0.95


def test_bkt_consecutive_incorrect_drops():
    """Consecutive incorrect answers should drive probability down towards floor."""
    engine = BktEngine()
    p = 0.80
    for _ in range(10):
        _, p = engine.update(p, is_correct=False)
    assert p < 0.35


def test_predict_correctness():
    """Predict correctness formula P(C) = P(L)*(1 - P(S)) + (1 - P(L))*P(G)."""
    engine = BktEngine(BktParameters(p_l0=0.5, p_t=0.1, p_g=0.25, p_s=0.10))
    p_c = engine.predict_correctness(0.5)
    expected = 0.5 * 0.90 + 0.5 * 0.25  # 0.45 + 0.125 = 0.575
    assert abs(p_c - expected) < 1e-6
