# YOUVA-EdAI — N12 High-School Curriculum, Rubrics & AI Disclosure Guidelines

## 1. High-School Curricular Scope (Grades 9–12)

YOUVA-EdAI extends beyond foundational Middle School mastery to encompass modern, industry-aligned computational, AI, and data competencies.

### Core Domain: Computer Science & Computational Thinking
- **CT-01 Decomposition**: Breaking complex architectural systems into modular components and decoupled subsystems.
- **CT-02 Algorithmic Optimization**: Complexity analysis ($O(1)$, $O(\log n)$, $O(n)$, $O(n^2)$), sorting, graph traversal, and caching strategies.
- **CT-03 State Machine Modeling**: Designing deterministic finite automata, lifecycle states, and transaction safeguards.
- **CT-04 Fault Tolerance & Debugging**: Systematic root cause analysis, error boundaries, automated test writing, and graceful degradation.

### Core Domain: Artificial Intelligence & Machine Learning Literacy
- **AI-01 Neural Network Fundamentals**: Embeddings, tokenization, attention mechanisms, loss surfaces, and gradient descent.
- **AI-02 Hallucination & Failure Modes**: Epistemic calibration, probabilistic generation vs deterministic execution, adversarial prompt injection.
- **AI-03 Prompt Architecture & Evaluation**: Few-shot structuring, Chain-of-Thought, system prompt boundaries, output schema enforcement.
- **AI-04 Responsible AI & Ethics**: Algorithmic bias, training data copyright, privacy preservation, environmental footprint, human-in-the-loop oversight.

### Core Domain: Data Science & Quantitative Reasoning
- **DS-01 Data Pipeline Hygiene**: Schema validation, missing value imputation, out-of-bounds anomaly detection.
- **DS-02 Exploratory Data Analysis**: Histograms, scatter matrices, correlation coefficients, variance analysis.
- **DS-03 Statistical Hypothesis Testing**: Null hypothesis, p-values, confidence intervals, sample size significance.
- **DS-04 Visual Communication**: Honest chart design, color accessibility, executive storytelling.

---

## 2. Structured 4-Tier Assessment Rubrics (Clause N12.33)

Every high-school project submission is assessed against 4 distinct developmental levels:

| Tier | Level Name | Points | Operational Definition |
| :---: | :--- | :---: | :--- |
| **1** | **Beginning** | 1 | Demonstrates superficial recall; requires continuous guidance; unable to detect errors or explain decisions. |
| **2** | **Developing** | 2 | Executes standard procedures; identifies common errors with assistance; produces partial or fragile solutions. |
| **3** | **Proficient** | 3 | Independently delivers complete, functional solutions; articulates architectural tradeoffs; valid test coverage. |
| **4** | **Advanced** | 4 | Designs robust, elegant systems; generalizes across domains; anticipates edge cases and explains security implications. |

### Evaluation Dimensions
1. **System Architecture & Decomposition** (Modularity, separation of concerns)
2. **Implementation Quality & Robustness** (Code cleanliness, error handling, edge cases)
3. **Verification & Testing Rigor** (Automated assertions, empirical validation)
4. **Reflection & Intellectual Ownership** (Defense of tradeoffs, understanding of limitations)

---

## 3. Academic Integrity & AI Assistance Disclosure Framework (Clauses N12.43–N12.45)

YOUVA-EdAI embraces generative AI as a thinking tool while ensuring that credentialed skills represent genuine human understanding.

### Student Disclosure Requirements
Students must declare their AI usage profile upon submission:
- **Brainstorming (%)**: Using LLMs for idea expansion, project theme brainstorming, alternate angles.
- **Code Generation (%)**: LLM-generated snippets, boilerplate, or function scaffolds.
- **Editing & Polishing (%)**: LLM grammatical cleanup, style refinement, and readability enhancements.
- **Research Synthesis (%)**: LLM document summarization, concept search, and glossary lookups.

### Human Intellectual Ownership Verification
Students must provide explicit evidence of human direction:
1. **Problem Definition**: Who framed the problem and requirements? (Must be human-authored)
2. **Key Design Decisions**: What architectural tradeoffs were made and why were specific AI suggestions rejected?
3. **Testing & Verification**: How did the student verify that generated code or claims were factually accurate?
4. **Learning Reflection**: What did the student learn through the project that they could not do before?

### Authenticity Scoring Heuristic
$$\text{Authenticity Score} = 1.0 - (0.4 \times \text{Unchecked AICodeRatio}) - (0.3 \times \text{MissingVerification}) - (0.3 \times \text{CopyPasteBursts})$$
- Scores $< 0.60$ trigger an automatic teacher inspection flag.
- Scores $\ge 0.85$ qualify for expedited Level 3/4 evidence validation.
