# Concept DAG Specification: CBSE Grade 8 Linear Equations

## 1. Node Definitions
The CBSE Grade 8 curriculum unit "Linear Equations in One Variable" is partitioned into 7 modular concept nodes:

| Node ID | Concept Title | Difficulty Band | Standard Code |
|---|---|---|---|
| `arithmetic_integers` | Integer Operations & Balancing | FOUNDATIONAL | CBSE-M8-01 |
| `algebraic_expressions` | Algebraic Expressions & Like Terms | FOUNDATIONAL | CBSE-M8-02 |
| `one_step_linear_equations` | One-Step Linear Equations | INTERMEDIATE | CBSE-M8-03 |
| `two_step_linear_equations` | Two-Step Linear Equations | INTERMEDIATE | CBSE-M8-04 |
| `variables_on_both_sides` | Equations with Variables on Both Sides | INTERMEDIATE | CBSE-M8-05 |
| `linear_equations_with_fractions` | Equations with Fractions / Cross-Multiplication | ADVANCED | CBSE-M8-06 |
| `word_problems_linear_equations` | Applications & Word Problems | ADVANCED | CBSE-M8-07 |

---

## 2. Dependency Edges (Prerequisites)
Prerequisite dependencies form a strict Directed Acyclic Graph (DAG):
1. `arithmetic_integers` $\to$ `one_step_linear_equations`
2. `algebraic_expressions` $\to$ `one_step_linear_equations`
3. `one_step_linear_equations` $\to$ `two_step_linear_equations`
4. `two_step_linear_equations` $\to$ `variables_on_both_sides`
5. `variables_on_both_sides` $\to$ `linear_equations_with_fractions`
6. `variables_on_both_sides` $\to$ `word_problems_linear_equations`
7. `linear_equations_with_fractions` $\to$ `word_problems_linear_equations`

---

## 3. Mathematical Properties
- **Cycle Count**: 0 (Strict DAG invariant validated via Tarjan's DFS algorithm).
- **In-degree Zero Nodes**: `arithmetic_integers`, `algebraic_expressions` (Entry points for diagnostic baseline).
- **Out-degree Zero Nodes**: `word_problems_linear_equations` (Terminal unit competency).
- **Topological Order**:
  $$\text{algebraic\_expressions} \prec \text{arithmetic\_integers} \prec \text{one\_step} \prec \text{two\_step} \prec \text{both\_sides} \prec \text{fractions} \prec \text{word\_problems}$$
