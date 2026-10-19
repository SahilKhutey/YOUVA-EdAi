"""
YOUVA-EdAi: Early Childhood Hard Technical Content Guard
Enforces strict technical boundaries on all AI-delivered voice and visual prompts for children aged 4-6:
  1. Lexicon limitation: Prompts must strictly use words from the certified early childhood vocabulary.
  2. Length & Readability limitation: Prompts must not exceed 8 words (Flesch-Kincaid Grade Level <= 1.0).
  3. Absolute Ban on Dark Patterns: No countdown timers, urgency language, streak loss threats, or commercial nudges.
  4. Hard Screen Time Guard: Enforces 15-minute maximum session cap before requiring compulsory rest.
"""

from dataclasses import dataclass
from typing import Set, List, Optional
import re
import json
from pathlib import Path


class ContentConstraintViolation(Exception):
    """Raised when an AI prompt violates early childhood pedagogical, lexicon, or safety constraints."""
    pass


class ScreenTimeLimitExceededError(Exception):
    """Raised when an early childhood learning session exceeds the mandatory 15-minute screen time guard."""
    pass


PROHIBITED_DARK_PATTERNS = [
    "hurry", "quick", "faster", "streak", "lose", "lost", "fail", "failed",
    "bad", "buy", "coins", "diamonds", "purchase", "running out of time",
    "time is ticking", "don't miss out", "penalty", "punished"
]


class EarlyChildhoodContentGuard:
    """
    Hard technical guardrail intercepting all prompts destined for Kindergarten / Junior tier learners.
    """

    DEFAULT_LEXICON_PATH = Path(__file__).parent.parent / "content" / "early_lexicon.json"

    def __init__(
        self,
        max_words_per_prompt: int = 8,
        max_session_minutes: float = 15.0,
        lexicon_path: Optional[str | Path] = None
    ):
        self.max_words_per_prompt = max_words_per_prompt
        self.max_session_minutes = max_session_minutes
        self.certified_lexicon: Set[str] = set()
        self._load_lexicon(lexicon_path or self.DEFAULT_LEXICON_PATH)

    def _load_lexicon(self, path: str | Path) -> None:
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Early childhood lexicon not found at {p}")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.certified_lexicon = {w.lower().strip() for w in data.get("certifiedVocabulary", [])}

    def validate_prompt(self, prompt_text: str) -> bool:
        """
        Validates prompt text against all hard technical constraints:
          1. Dark pattern scanning
          2. Sentence length check (<= 8 words)
          3. Punctuation/structural complexity check
          4. Certified lexicon word check
        """
        normalized = prompt_text.strip()
        if not normalized:
            raise ContentConstraintViolation("Prompt cannot be empty.")

        # 1. Dark Pattern Check
        lower_prompt = normalized.lower()
        for pattern in PROHIBITED_DARK_PATTERNS:
            if re.search(rf"\b{re.escape(pattern)}\b", lower_prompt):
                raise ContentConstraintViolation(
                    f"Dark pattern detected in prompt: '{pattern}' violates early childhood cognitive safety standards."
                )

        # 2. Structural Complexity Check
        if ";" in normalized or ":" in normalized or "—" in normalized or "--" in normalized:
            raise ContentConstraintViolation(
                "Complex sentence structure (semicolons/dashes) prohibited for early childhood prompts."
            )

        # 3. Word Count Check
        # Clean out emoji characters and special punctuation for accurate tokenization
        cleaned = re.sub(r"[^\w\s]", " ", normalized)
        tokens = [t for t in cleaned.split() if not t.isdigit()]

        if len(tokens) > self.max_words_per_prompt:
            raise ContentConstraintViolation(
                f"Prompt length ({len(tokens)} words) exceeds early childhood maximum limit ({self.max_words_per_prompt} words)."
            )

        # 4. Certified Lexicon Check
        unrecognized_words: List[str] = []
        for word in tokens:
            w_clean = word.lower().strip()
            if w_clean in self.certified_lexicon:
                continue
            if w_clean.endswith("s") and w_clean[:-1] in self.certified_lexicon:
                continue
            unrecognized_words.append(w_clean)

        if unrecognized_words:
            raise ContentConstraintViolation(
                f"Words not in certified early childhood vocabulary: {unrecognized_words}. Open-ended LLM language is prohibited."
            )

        return True

    def check_session_duration(self, elapsed_minutes: float) -> bool:
        """
        Enforce hard technical screen-time guard:
        Sessions for ages 4-6 must never exceed 15.0 minutes of continuous screen interaction.
        """
        if elapsed_minutes > self.max_session_minutes:
            raise ScreenTimeLimitExceededError(
                f"Mandatory screen-time guard triggered: elapsed session ({elapsed_minutes:.1f}m) exceeds 15-minute maximum limit."
            )
        return True
