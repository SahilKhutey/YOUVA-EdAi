"""
Bayesian Knowledge Tracing (BKT) Engine
Standard Corbett & Anderson (1995) 4-Parameter Model

Parameters:
  - P(L_0): Prior probability of knowing the skill initially
  - P(T):   Probability of learning (transitioning from unlearned to learned state)
  - P(G):   Probability of guessing correctly despite not knowing the skill
  - P(S):   Probability of slipping (making a mistake despite knowing the skill)

Equations:
  Observation Update (Posterior):
    If Correct (Obs = 1):
      P(L_t | Obs=1) = [P(L_{t-1}) * (1 - P(S))] / [P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)]

    If Incorrect (Obs = 0):
      P(L_t | Obs=0) = [P(L_{t-1}) * P(S)] / [P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G))]

  Next-Step Prediction:
    P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)

  Probability of Correct Response on Next Item:
    P(C_{t+1}) = P(L_{t+1}) * (1 - P(S)) + (1 - P(L_{t+1})) * P(G)
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class BktParameters:
    p_l0: float = 0.15  # Prior knowledge probability
    p_t: float = 0.20   # Learning transition probability
    p_g: float = 0.25   # Guess probability (standard 4-option MCQ)
    p_s: float = 0.10   # Slip probability

    def __post_init__(self):
        for name, val in [("p_l0", self.p_l0), ("p_t", self.p_t), ("p_g", self.p_g), ("p_s", self.p_s)]:
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"{name} must be between 0.0 and 1.0 (got {val})")
        if self.p_g >= (1.0 - self.p_s):
            raise ValueError("Degenerate parameters: P(G) must be strictly less than 1 - P(S)")


class BktEngine:
    def __init__(self, default_params: BktParameters = None):
        self.params = default_params or BktParameters()

    def update(
        self,
        current_p_l: float,
        is_correct: bool,
        item_params: BktParameters = None
    ) -> Tuple[float, float]:
        """
        Updates knowledge state given an answer observation.
        
        Args:
            current_p_l: Prior mastery probability P(L_{t-1})
            is_correct: Whether student answered correctly (True/False)
            item_params: Optional item-specific BKT parameters (defaults to self.params)
            
        Returns:
            Tuple of:
              - posterior_p_l: P(L_t | Obs)
              - next_p_l: P(L_{t+1}) ready for next question
        """
        p = item_params or self.params
        p_l_prev = max(0.001, min(0.999, current_p_l))

        if is_correct:
            # P(Obs=1 | L=1) = 1 - P(S)
            p_obs_given_l = 1.0 - p.p_s
            # P(Obs=1 | L=0) = P(G)
            p_obs_given_not_l = p.p_g
        else:
            # P(Obs=0 | L=1) = P(S)
            p_obs_given_l = p.p_s
            # P(Obs=0 | L=0) = 1 - P(G)
            p_obs_given_not_l = 1.0 - p.p_g

        numerator = p_l_prev * p_obs_given_l
        denominator = numerator + (1.0 - p_l_prev) * p_obs_given_not_l

        # Guard against zero division
        if denominator == 0:
            posterior = p_l_prev
        else:
            posterior = numerator / denominator

        # Step 2: Learning transition update for next item
        next_p_l = posterior + (1.0 - posterior) * p.p_t

        # Clamp between 0.001 and 0.999 (avoid certainty degeneration)
        next_p_l = max(0.001, min(0.999, next_p_l))
        return posterior, next_p_l

    def predict_correctness(self, current_p_l: float, item_params: BktParameters = None) -> float:
        """
        Calculates the probability that a student will answer the next item correctly.
        P(C) = P(L) * (1 - P(S)) + (1 - P(L)) * P(G)
        """
        p = item_params or self.params
        return current_p_l * (1.0 - p.p_s) + (1.0 - current_p_l) * p.p_g
