"""
Adaptive Next-Item Selection Algorithm
Operates within the Zone of Proximal Development (ZPD)
"""

from typing import List, Dict, Any, Optional
from .bkt_engine import BktEngine, BktParameters
from .knowledge_state import TopicKnowledgeState


ZPD_LOWER_BOUND = 0.35
ZPD_UPPER_BOUND = 0.75


class AdaptiveItemSelector:
    def __init__(self, engine: BktEngine):
        self.engine = engine

    def select_next_item(
        self,
        knowledge_state: TopicKnowledgeState,
        question_bank: List[Dict[str, Any]],
        recent_question_ids: List[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Selects the optimal practice item in the student's Zone of Proximal Development.
        
        Args:
            knowledge_state: Current student mastery state
            question_bank: Available items in the subject/unit
            recent_question_ids: IDs of questions recently answered (anti-repetition)
            
        Returns:
            The selected question dictionary, or None if the pool is exhausted
        """
        recent = set(recent_question_ids or [])
        answered_ids = {a.question_id for a in knowledge_state.attempts if a.is_correct}

        # Filter out already mastered/correctly-answered items and recent items
        candidates = [
            q for q in question_bank
            if q["questionId"] not in answered_ids
            and q["questionId"] not in recent
        ]

        # If all unencountered questions are exhausted, allow repetition of previously failed items
        if not candidates:
            candidates = [
                q for q in question_bank
                if q["questionId"] not in recent
            ]

        if not candidates:
            return None

        # Score each candidate by proximity to optimal challenge (P(correct) ~ 0.60)
        TARGET_P_CORRECT = 0.60
        scored_candidates = []

        for q in candidates:
            # Construct item-specific BKT params if specified, otherwise use default
            item_params = None
            if "bktParams" in q:
                bp = q["bktParams"]
                item_params = BktParameters(
                    p_l0=knowledge_state.bkt_params.p_l0,
                    p_t=knowledge_state.bkt_params.p_t,
                    p_g=bp.get("p_g", 0.25),
                    p_s=bp.get("p_s", 0.10)
                )

            p_correct = self.engine.predict_correctness(
                knowledge_state.current_p_l,
                item_params=item_params
            )

            # Check if within ZPD range
            in_zpd = ZPD_LOWER_BOUND <= p_correct <= ZPD_UPPER_BOUND
            distance_from_optimal = abs(p_correct - TARGET_P_CORRECT)

            scored_candidates.append({
                "question": q,
                "p_correct": p_correct,
                "in_zpd": in_zpd,
                "distance": distance_from_optimal
            })

        # Sort preference: first prefer in_zpd == True, then sort by minimum distance to optimal
        scored_candidates.sort(key=lambda x: (not x["in_zpd"], x["distance"]))

        return scored_candidates[0]["question"]
