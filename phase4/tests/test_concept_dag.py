"""
Unit tests for Concept Directed Acyclic Graph (DAG) Engine
"""

import pytest
from pathlib import Path
from phase4.models.concept_dag import (
    ConceptDAG,
    ConceptNode,
    PrerequisiteEdge,
    CycleDetectedError,
    NodeNotFoundError
)

ROOT = Path(__file__).parent.parent.parent
DAG_PATH = ROOT / "phase4" / "data" / "grade8_math_concept_dag.json"


@pytest.fixture
def grade8_dag():
    return ConceptDAG.load_from_json(DAG_PATH)


def test_load_grade8_dag(grade8_dag):
    assert len(grade8_dag.nodes) == 7
    assert len(grade8_dag.edges) == 7
    assert "arithmetic_integers" in grade8_dag.nodes
    assert "linear_equations_with_fractions" in grade8_dag.nodes


def test_acyclicity_invariant(grade8_dag):
    assert grade8_dag.validate_acyclicity() is True


def test_cycle_detection_raises_error():
    dag = ConceptDAG()
    dag.add_node(ConceptNode("C1", "Concept 1", "Desc", "FOUNDATIONAL", "STD-1"))
    dag.add_node(ConceptNode("C2", "Concept 2", "Desc", "INTERMEDIATE", "STD-2"))
    dag.add_node(ConceptNode("C3", "Concept 3", "Desc", "ADVANCED", "STD-3"))

    dag.add_edge(PrerequisiteEdge("C1", "C2"))
    dag.add_edge(PrerequisiteEdge("C2", "C3"))
    dag.add_edge(PrerequisiteEdge("C3", "C1"))  # Cycle!

    with pytest.raises(CycleDetectedError):
        dag.validate_acyclicity()

    with pytest.raises(CycleDetectedError):
        dag.topological_sort()


def test_missing_node_edge_raises_error():
    dag = ConceptDAG()
    dag.add_node(ConceptNode("C1", "Concept 1", "Desc", "FOUNDATIONAL", "STD-1"))

    with pytest.raises(NodeNotFoundError):
        dag.add_edge(PrerequisiteEdge("C1", "NON_EXISTENT"))

    with pytest.raises(NodeNotFoundError):
        dag.add_edge(PrerequisiteEdge("NON_EXISTENT", "C1"))


def test_topological_sort(grade8_dag):
    order = grade8_dag.topological_sort()
    assert len(order) == 7

    # Invariants: prerequisite must appear before dependent
    for edge in grade8_dag.edges:
        from_idx = order.index(edge.from_node)
        to_idx = order.index(edge.to_node)
        assert from_idx < to_idx, f"{edge.from_node} should precede {edge.to_node}"


def test_direct_and_transitive_prerequisites(grade8_dag):
    # arithmetic_integers -> one_step -> two_step -> variables_on_both_sides -> fractions
    direct = grade8_dag.get_prerequisites("linear_equations_with_fractions", direct_only=True)
    assert "variables_on_both_sides" in direct
    assert "arithmetic_integers" not in direct

    transitive = grade8_dag.get_prerequisites("linear_equations_with_fractions", direct_only=False)
    assert "variables_on_both_sides" in transitive
    assert "two_step_linear_equations" in transitive
    assert "one_step_linear_equations" in transitive
    assert "arithmetic_integers" in transitive


def test_backward_remediation_tracing(grade8_dag):
    # Student has zero mastery in arithmetic_integers and one_step
    mastery = {
        "arithmetic_integers": 0.30,
        "algebraic_expressions": 0.90,
        "one_step_linear_equations": 0.40,
        "two_step_linear_equations": 0.88,
        "variables_on_both_sides": 0.86,
        "linear_equations_with_fractions": 0.20
    }
    remediation = grade8_dag.find_remediation_path(
        mastery,
        "linear_equations_with_fractions",
        mastery_threshold=0.85
    )

    # Remediation sequence must be topologically ordered
    assert remediation[0] == "arithmetic_integers"
    assert remediation[1] == "one_step_linear_equations"
    assert remediation[-1] == "linear_equations_with_fractions"


def test_zpd_frontier_calculation(grade8_dag):
    # New student with no mastered concepts
    empty_mastery = {}
    zpd = grade8_dag.calculate_zpd_frontier(empty_mastery, mastery_threshold=0.85)
    # Foundational nodes with no prerequisites must be in ZPD
    assert "algebraic_expressions" in zpd
    assert "arithmetic_integers" in zpd
    assert "two_step_linear_equations" not in zpd  # Needs prerequisites first
