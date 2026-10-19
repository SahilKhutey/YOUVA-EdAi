"""
Unit tests for Grade 10 Content Bank, Diagnostic Assessment & Concept DAG
"""

import json
import pytest
from pathlib import Path
from phase4.models.concept_dag import ConceptDAG

ROOT = Path(__file__).parent.parent.parent
BANK_PATH = ROOT / "phase5" / "content" / "grade10_quadratic_equations_bank.json"
DIAG_PATH = ROOT / "phase5" / "content" / "grade10_diagnostic_assessment.json"
DAG_PATH = ROOT / "phase5" / "content" / "grade10_concept_dag.json"


def test_question_bank_structure():
    with open(BANK_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["subject"] == "Mathematics"
    assert data["grade"] == "Grade 10"
    assert data["competencyCode"] == "MATH-G10-QUAD-01"

    questions = data["questions"]
    assert len(questions) == 20

    question_ids = set()
    for q in questions:
        assert q["questionId"] not in question_ids
        question_ids.add(q["questionId"])
        assert len(q["options"]) == 4
        assert 0 <= q["correctOptionIndex"] <= 3
        assert q["difficulty"] in ["EASY", "MEDIUM", "HARD"]
        assert "p_g" in q["bktParams"]
        assert "p_s" in q["bktParams"]
        assert "p_t" in q["bktParams"]
        assert "p_l0" in q["bktParams"]


def test_diagnostic_assessment_structure():
    with open(DIAG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["grade"] == "Grade 10"
    items = data["items"]
    assert len(items) == 5

    concepts = [it["conceptId"] for it in items]
    assert "standard_quadratic_form" in concepts
    assert "factorisation_roots" in concepts
    assert "discriminant_nature_roots" in concepts
    assert "quadratic_formula" in concepts
    assert "word_problems_quadratic" in concepts


def test_grade10_concept_dag():
    dag = ConceptDAG.load_from_json(DAG_PATH)
    assert len(dag.nodes) == 6
    assert len(dag.edges) == 6
    assert dag.validate_acyclicity() is True

    topo = dag.topological_sort()
    assert len(topo) == 6
    assert topo.index("linear_polynomials") < topo.index("standard_quadratic_form")
    assert topo.index("standard_quadratic_form") < topo.index("word_problems_quadratic")
