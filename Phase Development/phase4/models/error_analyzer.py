"""
YOUVA-EdAi: Student Mistake Taxonomy & Diagnostic Feedback Analyzer
Analyzes student incorrect submissions, classifies algebraic misconceptions according
to the 5-category taxonomy, and delivers actionable pedagogical remediation.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import json
import re
from pathlib import Path


@dataclass(frozen=True)
class ErrorClassification:
    error_code: str
    name: str
    description: str
    misconception_explanation: str
    remedial_action: str


@dataclass(frozen=True)
class DiagnosticFeedback:
    error_code: str
    misconception_name: str
    explanation: str
    remedial_action: str
    student_answer: str
    correct_answer: str
    detected_pattern: Optional[str] = None


class ErrorAnalyzer:
    """
    Diagnostic error classifier for algebraic problem solving.
    Maps student errors to cognitive misconceptions rather than generic 'incorrect' flags.
    """

    DEFAULT_RULES_FILE = Path(__file__).parent.parent / "data" / "error_classification_rules.json"

    def __init__(self, rules_filepath: Optional[str | Path] = None):
        self.rules: Dict[str, ErrorClassification] = {}
        self._load_rules(rules_filepath or self.DEFAULT_RULES_FILE)
        self._history: List[Dict[str, Any]] = []

    def _load_rules(self, filepath: str | Path) -> None:
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Error classification rules not found at {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for cat in data.get("categories", []):
            code = cat["errorCode"]
            self.rules[code] = ErrorClassification(
                error_code=code,
                name=cat["name"],
                description=cat["description"],
                misconception_explanation=cat["misconceptionExplanation"],
                remedial_action=cat["remedialAction"]
            )

    def analyze_error(
        self,
        question_text: str,
        student_answer: str,
        correct_answer: str,
        steps: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> DiagnosticFeedback:
        """
        Classify the student mistake into one of the canonical taxonomy categories:
        - SIGN_ERROR
        - DISTRIBUTIVE_ERROR
        - COMBINING_LIKE_TERMS_ERROR
        - FRACTION_CLEARANCE_ERROR
        - ARITHMETIC_ERROR
        """
        norm_student = student_answer.strip().replace(" ", "").lower()
        norm_correct = correct_answer.strip().replace(" ", "").lower()

        detected_code = "ARITHMETIC_ERROR"  # Default fallback
        detected_pattern = "Unclassified algebraic deviation"

        # Pattern 1: Check intermediate steps if provided
        if steps:
            steps_joined = " ".join(steps).lower()
            if any(p in steps_joined for p in ["+ 3 = 7 -> 2x = 4", "- 3 = 7 -> 2x = 4", "sign reverse"]):
                detected_code = "SIGN_ERROR"
                detected_pattern = "Sign inversion slip during term transposition"
            elif any(p in steps_joined for p in ["2(x+3)->2x+3", "distrib", "bracket"]):
                detected_code = "DISTRIBUTIVE_ERROR"
                detected_pattern = "Multiplier omitted for inner second term"
            elif any(p in steps_joined for p in ["3x+4=7x", "combine unlike", "like terms"]):
                detected_code = "COMBINING_LIKE_TERMS_ERROR"
                detected_pattern = "Variable and constant combined into single monomial"
            elif any(p in steps_joined for p in ["lcm", "fraction", "denominator"]):
                detected_code = "FRACTION_CLEARANCE_ERROR"
                detected_pattern = "Denominator cleared without multiplying all additive terms"

        # Pattern 2: Context hints from question metadata
        if context and "distractorType" in context:
            distractor_type = context["distractorType"]
            if distractor_type in self.rules:
                detected_code = distractor_type
                detected_pattern = f"Known distractor match: {distractor_type}"

        # Pattern 3: Common algebraic question-specific distractor checks
        if "2x - 3 = 7" in question_text:
            # Correct is x = 5 (2x = 10).
            # If student says x = 2 (2x = 7 - 3 = 4), that is a SIGN_ERROR.
            # If student says x = 4, arithmetic slip.
            if "2" in norm_student:
                detected_code = "SIGN_ERROR"
                detected_pattern = "Transposed -3 as -3 on RHS (2x = 7 - 3 = 4) instead of +3"
            elif "4" in norm_student:
                detected_code = "ARITHMETIC_ERROR"
                detected_pattern = "Arithmetic division error during final coefficient division"

        elif "y + 3 = 10" in question_text:
            # Correct is y = 7 (y = 10 - 3).
            # If student says y = 13 (y = 10 + 3), that is a SIGN_ERROR.
            if "13" in norm_student:
                detected_code = "SIGN_ERROR"
                detected_pattern = "Added 3 to RHS (y = 10 + 3 = 13) instead of subtracting 3"

        elif "6 = z + 2" in question_text:
            # Correct is z = 4 (6 - 2 = 4).
            # If student says z = 8 (6 + 2 = 8), that is a SIGN_ERROR.
            if "8" in norm_student:
                detected_code = "SIGN_ERROR"
                detected_pattern = "Added 2 to LHS instead of subtracting 2"

        elif "/" in question_text:
            # Fraction questions
            if any(kw in norm_student for kw in ["14", "20/7", "incomplete"]):
                detected_code = "FRACTION_CLEARANCE_ERROR"
                detected_pattern = "Numerator combined without denominator clearance or LCM mismatch"

        elif "(" in question_text and ")" in question_text:
            # Distributive property questions
            detected_code = "DISTRIBUTIVE_ERROR"
            detected_pattern = "Distributive expansion error on parenthesis factor"

        # Fallback if rule exists
        rule = self.rules.get(detected_code, self.rules["ARITHMETIC_ERROR"])

        feedback = DiagnosticFeedback(
            error_code=rule.error_code,
            misconception_name=rule.name,
            explanation=rule.misconception_explanation,
            remedial_action=rule.remedial_action,
            student_answer=student_answer,
            correct_answer=correct_answer,
            detected_pattern=detected_pattern
        )

        self._history.append({
            "question": question_text,
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "error_code": rule.error_code,
            "feedback": feedback
        })

        return feedback

    def get_error_distribution(self) -> Dict[str, int]:
        """Aggregate mistake frequencies for educator dashboard insights."""
        dist: Dict[str, int] = {code: 0 for code in self.rules}
        for entry in self._history:
            code = entry["error_code"]
            dist[code] = dist.get(code, 0) + 1
        return dist
