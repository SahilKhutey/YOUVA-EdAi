"""
YOUVA-EdAi: Concept Directed Acyclic Graph (DAG) Engine
Provides cycle-free curriculum dependency modeling, topological sorting,
and backward prerequisite remediation path tracing for personalized ITS learning loops.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple
import json
from pathlib import Path


class CycleDetectedError(Exception):
    """Raised when a cycle is detected in the curriculum prerequisite graph."""
    pass


class NodeNotFoundError(Exception):
    """Raised when an edge references a non-existent concept node."""
    pass


@dataclass(frozen=True)
class ConceptNode:
    id: str
    title: str
    description: str
    difficulty_band: str  # FOUNDATIONAL, INTERMEDIATE, ADVANCED
    standard_code: str


@dataclass(frozen=True)
class PrerequisiteEdge:
    from_node: str  # Prerequisite
    to_node: str    # Target concept
    relationship_type: str = "STRICT_PREREQUISITE"


class ConceptDAG:
    """
    Empirical Knowledge Graph modeling curricular dependencies as a Directed Acyclic Graph.
    Guarantees acyclicity and provides remediation traversal for learning paths.
    """

    def __init__(self, curriculum: str = "CBSE / NCERT", subject: str = "Mathematics", grade: str = "Grade 8"):
        self.curriculum = curriculum
        self.subject = subject
        self.grade = grade
        self._nodes: Dict[str, ConceptNode] = {}
        self._adjacency: Dict[str, Set[str]] = {}       # from_node -> set of to_nodes (dependents)
        self._reverse_adj: Dict[str, Set[str]] = {}     # to_node -> set of from_nodes (prerequisites)
        self._edges: List[PrerequisiteEdge] = []

    @classmethod
    def load_from_json(cls, filepath: str | Path) -> "ConceptDAG":
        """Load and validate a ConceptDAG from a JSON definition."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"DAG definition not found at {path}")
        
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        dag = cls(
            curriculum=data.get("curriculum", "CBSE / NCERT"),
            subject=data.get("subject", "Mathematics"),
            grade=data.get("grade", "Grade 8")
        )

        for n in data.get("nodes", []):
            dag.add_node(ConceptNode(
                id=n["id"],
                title=n["title"],
                description=n["description"],
                difficulty_band=n.get("difficultyBand", "INTERMEDIATE"),
                standard_code=n.get("standardCode", "")
            ))

        for e in data.get("edges", []):
            dag.add_edge(PrerequisiteEdge(
                from_node=e["fromNode"],
                to_node=e["toNode"],
                relationship_type=e.get("relationshipType", "STRICT_PREREQUISITE")
            ))

        # Enforce DAG invariant immediately on load
        dag.validate_acyclicity()
        return dag

    def add_node(self, node: ConceptNode) -> None:
        """Add a concept node to the graph."""
        self._nodes[node.id] = node
        if node.id not in self._adjacency:
            self._adjacency[node.id] = set()
        if node.id not in self._reverse_adj:
            self._reverse_adj[node.id] = set()

    def add_edge(self, edge: PrerequisiteEdge) -> None:
        """Add a prerequisite dependency: from_node MUST precede to_node."""
        if edge.from_node not in self._nodes:
            raise NodeNotFoundError(f"Prerequisite node '{edge.from_node}' does not exist.")
        if edge.to_node not in self._nodes:
            raise NodeNotFoundError(f"Target node '{edge.to_node}' does not exist.")

        self._edges.append(edge)
        self._adjacency[edge.from_node].add(edge.to_node)
        self._reverse_adj[edge.to_node].add(edge.from_node)

    @property
    def nodes(self) -> Dict[str, ConceptNode]:
        return self._nodes

    @property
    def edges(self) -> List[PrerequisiteEdge]:
        return self._edges

    def get_node(self, node_id: str) -> ConceptNode:
        if node_id not in self._nodes:
            raise NodeNotFoundError(f"Concept node '{node_id}' not found.")
        return self._nodes[node_id]

    def validate_acyclicity(self) -> bool:
        """
        Verify that the graph contains NO directed cycles using Tarjan/DFS coloring.
        White (0) = Unvisited, Gray (1) = Visiting, Black (2) = Visited.
        """
        state: Dict[str, int] = {node_id: 0 for node_id in self._nodes}
        visiting_path: List[str] = []

        def dfs(node: str) -> None:
            state[node] = 1
            visiting_path.append(node)

            for neighbor in self._adjacency.get(node, set()):
                if state[neighbor] == 1:
                    cycle_start = visiting_path.index(neighbor)
                    cycle = visiting_path[cycle_start:] + [neighbor]
                    raise CycleDetectedError(f"Cycle detected in Concept DAG: {' -> '.join(cycle)}")
                if state[neighbor] == 0:
                    dfs(neighbor)

            visiting_path.pop()
            state[node] = 2

        for node_id in self._nodes:
            if state[node_id] == 0:
                dfs(node_id)

        return True

    def topological_sort(self) -> List[str]:
        """
        Produce a valid topological ordering of concepts using Kahn's algorithm.
        Ensures all prerequisite concepts appear before dependent concepts.
        """
        self.validate_acyclicity()

        in_degree = {n: len(self._reverse_adj[n]) for n in self._nodes}
        queue = [n for n in self._nodes if in_degree[n] == 0]
        # Sort queue for deterministic ordering
        queue.sort()

        order: List[str] = []
        while queue:
            curr = queue.pop(0)
            order.append(curr)

            for dependent in sorted(self._adjacency[curr]):
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)

        if len(order) != len(self._nodes):
            raise CycleDetectedError("Graph contains circular prerequisites; topological sort impossible.")

        return order

    def get_prerequisites(self, node_id: str, direct_only: bool = False) -> Set[str]:
        """Return direct or transitive prerequisite concept IDs for a given node."""
        if node_id not in self._nodes:
            raise NodeNotFoundError(f"Concept node '{node_id}' not found.")

        if direct_only:
            return set(self._reverse_adj[node_id])

        visited: Set[str] = set()
        queue = list(self._reverse_adj[node_id])
        while queue:
            curr = queue.pop(0)
            if curr not in visited:
                visited.add(curr)
                queue.extend(self._reverse_adj[curr])
        return visited

    def get_dependents(self, node_id: str, direct_only: bool = False) -> Set[str]:
        """Return direct or transitive dependent concept IDs that require node_id."""
        if node_id not in self._nodes:
            raise NodeNotFoundError(f"Concept node '{node_id}' not found.")

        if direct_only:
            return set(self._adjacency[node_id])

        visited: Set[str] = set()
        queue = list(self._adjacency[node_id])
        while queue:
            curr = queue.pop(0)
            if curr not in visited:
                visited.add(curr)
                queue.extend(self._adjacency[curr])
        return visited

    def find_remediation_path(
        self,
        student_mastery: Dict[str, float],
        target_concept_id: str,
        mastery_threshold: float = 0.85
    ) -> List[str]:
        """
        Backwards Prerequisite Remediation Tracer:
        Given a student's current BKT mastery dictionary {concept_id: p_l},
        identifies unmastered prerequisites (< threshold) for target_concept_id
        and orders them in forward pedagogical topological sequence.
        """
        if target_concept_id not in self._nodes:
            raise NodeNotFoundError(f"Target concept '{target_concept_id}' not found.")

        all_prereqs = self.get_prerequisites(target_concept_id, direct_only=False)
        unmastered_prereqs = {
            p for p in all_prereqs
            if student_mastery.get(p, 0.0) < mastery_threshold
        }

        if not unmastered_prereqs:
            # All prerequisites are satisfied; if target itself is unmastered, return [target_concept_id]
            if student_mastery.get(target_concept_id, 0.0) < mastery_threshold:
                return [target_concept_id]
            return []

        # Return unmastered prerequisites sorted by topological order (foundations first)
        topo_order = self.topological_sort()
        remediation_path = [cid for cid in topo_order if cid in unmastered_prereqs]

        # Append target concept at the end of the remediation path
        if student_mastery.get(target_concept_id, 0.0) < mastery_threshold:
            remediation_path.append(target_concept_id)

        return remediation_path

    def calculate_zpd_frontier(
        self,
        student_mastery: Dict[str, float],
        mastery_threshold: float = 0.85
    ) -> List[str]:
        """
        Zone of Proximal Development (ZPD) Frontier:
        Identifies concepts where ALL prerequisites are mastered (>= threshold),
        but the concept itself is NOT yet mastered (< threshold).
        These represent optimal cognitive challenges ready for instruction.
        """
        frontier: List[str] = []
        for node_id in self._nodes:
            current_p = student_mastery.get(node_id, 0.0)
            if current_p >= mastery_threshold:
                continue  # Already mastered

            direct_prereqs = self.get_prerequisites(node_id, direct_only=True)
            prereqs_satisfied = all(
                student_mastery.get(p, 0.0) >= mastery_threshold
                for p in direct_prereqs
            )

            if prereqs_satisfied:
                frontier.append(node_id)

        # Sort in topological order
        topo = self.topological_sort()
        return [cid for cid in topo if cid in frontier]
