"""
Unit tests for Early Childhood Content Bank & Certified Lexicon
"""

import json
import pytest
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
BANK_PATH = ROOT / "phase6" / "content" / "foundational_numeracy_bank.json"
DIAG_PATH = ROOT / "phase6" / "content" / "foundational_diagnostic.json"
LEX_PATH = ROOT / "phase6" / "content" / "early_lexicon.json"


def test_foundational_numeracy_bank_structure():
    with open(BANK_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["tier"] == "KINDERGARTEN_JUNIOR"
    assert data["ageBand"] == "4-6 years"
    items = data["items"]
    assert len(items) == 20

    seen_ids = set()
    for item in items:
        assert item["itemId"] not in seen_ids
        seen_ids.add(item["itemId"])
        assert item["audioPrompt"]
        assert len(item["options"]) in [3, 4]
        assert 0 <= item["correctOptionIndex"] < len(item["options"])
        assert item["conceptId"] in [
            "counting_1_5", "counting_6_10", "number_recognition",
            "shape_identification", "rhyming_phonics"
        ]
        assert "p_g" in item["bktParams"]
        assert "p_s" in item["bktParams"]


def test_foundational_diagnostic_structure():
    with open(DIAG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["tier"] == "KINDERGARTEN_JUNIOR"
    items = data["items"]
    assert len(items) == 5
    for it in items:
        assert it["itemId"]
        assert it["audioPrompt"]
        assert len(it["options"]) == 3
        assert 0 <= it["correctOptionIndex"] < 3


def test_certified_lexicon_structure():
    with open(LEX_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["targetAge"] == "4-6 years"
    words = data["certifiedVocabulary"]
    assert len(words) >= 100
    assert "apple" in words
    assert "cat" in words
    assert "dog" in words
    assert "circle" in words
    assert "star" in words
