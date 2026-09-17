import { Injectable, Logger } from '@nestjs/common';

export interface ConceptNode {
  id: string;
  title: string;
  unit: string;
  subject: 'MATH' | 'SCIENCE';
  prerequisites: string[]; // List of parent concept IDs
  difficultyBase: number; // 0.1 to 0.9
}

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);
  private readonly nodes = new Map<string, ConceptNode>();

  constructor() {
    this.initializeGraph();
  }

  private initializeGraph(): void {
    // --- MATHEMATICS (Grade 8) ---
    this.registerNode({
      id: 'integers-review',
      title: 'Integers and Signed Arithmetic Review',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: [],
      difficultyBase: 0.2,
    });

    this.registerNode({
      id: 'fraction-fundamentals',
      title: 'Fraction Simplification & Equivalence',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['integers-review'],
      difficultyBase: 0.3,
    });

    this.registerNode({
      id: 'rational-number-def',
      title: 'Rational Numbers Definition & Properties',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['fraction-fundamentals'],
      difficultyBase: 0.4,
    });

    this.registerNode({
      id: 'number-line-representation',
      title: 'Representation of Rational Numbers on Number Line',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['rational-number-def'],
      difficultyBase: 0.45,
    });

    this.registerNode({
      id: 'rational-addition-subtraction',
      title: 'Addition and Subtraction of Rational Numbers',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['rational-number-def'],
      difficultyBase: 0.5,
    });

    this.registerNode({
      id: 'rational-multiplication',
      title: 'Multiplication of Rational Numbers',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['rational-addition-subtraction'],
      difficultyBase: 0.55,
    });

    this.registerNode({
      id: 'reciprocals-and-division',
      title: 'Reciprocals and Division of Rational Numbers',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['rational-multiplication'],
      difficultyBase: 0.65,
    });

    this.registerNode({
      id: 'distributive-property-rational',
      title: 'Distributivity of Multiplication over Addition',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['rational-multiplication', 'rational-addition-subtraction'],
      difficultyBase: 0.7,
    });

    this.registerNode({
      id: 'rational-word-problems',
      title: 'Real-World Transfer Problems in Rational Numbers',
      unit: 'math-unit-01',
      subject: 'MATH',
      prerequisites: ['reciprocals-and-division', 'distributive-property-rational'],
      difficultyBase: 0.8,
    });

    // --- SCIENCE (Grade 8) ---
    this.registerNode({
      id: 'living-organisms-overview',
      title: 'Overview of Organisms and Levels of Organization',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: [],
      difficultyBase: 0.25,
    });

    this.registerNode({
      id: 'cell-discovery-and-theory',
      title: 'Discovery of the Cell & Cell Theory',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: ['living-organisms-overview'],
      difficultyBase: 0.35,
    });

    this.registerNode({
      id: 'cell-structure-components',
      title: 'Basic Components of Cell Structure',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: ['cell-discovery-and-theory'],
      difficultyBase: 0.45,
    });

    this.registerNode({
      id: 'cell-membrane-and-wall',
      title: 'Cell Membrane and Cell Wall Functions',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: ['cell-structure-components'],
      difficultyBase: 0.55,
    });

    this.registerNode({
      id: 'nucleus-and-cytoplasm',
      title: 'Nucleus, Chromosomes, and Cytoplasm',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: ['cell-structure-components'],
      difficultyBase: 0.6,
    });

    this.registerNode({
      id: 'plant-vs-animal-cells',
      title: 'Comparative Analysis: Plant Cells vs Animal Cells',
      unit: 'sci-unit-01',
      subject: 'SCIENCE',
      prerequisites: ['cell-membrane-and-wall', 'nucleus-and-cytoplasm'],
      difficultyBase: 0.75,
    });
  }

  registerNode(node: ConceptNode): void {
    this.nodes.set(node.id, node);
  }

  getNode(conceptId: string): ConceptNode | undefined {
    return this.nodes.get(conceptId);
  }

  getAllNodes(): ConceptNode[] {
    return Array.from(this.nodes.values());
  }

  getPrerequisites(conceptId: string): string[] {
    const node = this.nodes.get(conceptId);
    return node ? [...node.prerequisites] : [];
  }

  /**
   * Evaluates whether all direct prerequisites satisfy the minimum threshold.
   */
  arePrerequisitesSatisfied(
    conceptId: string,
    masteryMap: Record<string, number>,
    threshold = 0.70,
  ): { satisfied: boolean; missingPrerequisites: string[] } {
    const prereqs = this.getPrerequisites(conceptId);
    const missing: string[] = [];

    for (const p of prereqs) {
      const score = masteryMap[p] ?? 0;
      if (score < threshold) {
        missing.push(p);
      }
    }

    return {
      satisfied: missing.length === 0,
      missingPrerequisites: missing,
    };
  }

  /**
   * Traces back through prerequisites to find the earliest weak link.
   */
  getDiagnosedPrerequisiteGap(
    conceptId: string,
    masteryMap: Record<string, number>,
    threshold = 0.70,
  ): string | null {
    const prereqs = this.getPrerequisites(conceptId);
    for (const p of prereqs) {
      const score = masteryMap[p] ?? 0;
      if (score < threshold) {
        // Recurse to see if there is an even deeper gap
        const deeper = this.getDiagnosedPrerequisiteGap(p, masteryMap, threshold);
        return deeper || p;
      }
    }
    return null;
  }

  /**
   * Returns candidate concepts whose prerequisites are satisfied, prioritizing the active learning frontier.
   */
  getAvailableCandidates(
    masteryMap: Record<string, number>,
    threshold = 0.70,
    subject?: 'MATH' | 'SCIENCE',
  ): ConceptNode[] {
    const subjectNodes = Array.from(this.nodes.values()).filter(
      (n) => !subject || n.subject === subject,
    );
    const allGraphSubjectNodesMastered =
      subjectNodes.length > 0 &&
      subjectNodes.every((n) => (masteryMap[n.id] ?? 0) >= 0.85);

    if (allGraphSubjectNodesMastered) {
      // Entire curriculum graph in this subject is mastered: return empty so fallback extension triggers
      return [];
    }

    const activeEntries = Object.entries(masteryMap).filter(([id]) => {
      const node = this.getNode(id);
      return node && (!subject || node.subject === subject);
    });

    // If all attempted concepts in this subject are mastered (>= 0.85), select highest mastered node for extension
    const allAttemptedMastered =
      activeEntries.length > 0 && activeEntries.every(([, score]) => score >= 0.85);

    if (allAttemptedMastered) {
      const sorted = activeEntries
        .map(([id]) => this.getNode(id)!)
        .sort((a, b) => b.difficultyBase - a.difficultyBase);
      return [sorted[0]];
    }

    const candidates: ConceptNode[] = [];

    // 1. First look for frontier concepts: prerequisites are satisfied, but mastery < threshold
    for (const node of this.nodes.values()) {
      if (subject && node.subject !== subject) {
        continue;
      }
      const currentM = masteryMap[node.id] ?? 0;
      if (currentM < threshold) {
        const { satisfied } = this.arePrerequisitesSatisfied(node.id, masteryMap, threshold);
        if (satisfied) {
          candidates.push(node);
        }
      }
    }

    // Prioritize in-progress (currentM > 0) over unstarted (currentM == 0),
    // then sort by difficultyBase ascending.
    candidates.sort((a, b) => {
      const mA = masteryMap[a.id] ?? 0;
      const mB = masteryMap[b.id] ?? 0;
      const aInProgress = mA > 0 ? 1 : 0;
      const bInProgress = mB > 0 ? 1 : 0;
      if (aInProgress !== bInProgress) {
        return bInProgress - aInProgress;
      }
      return a.difficultyBase - b.difficultyBase;
    });

    // 2. If no frontier concepts < threshold found, look for concepts with threshold <= M < 0.85
    if (candidates.length === 0) {
      for (const node of this.nodes.values()) {
        if (subject && node.subject !== subject) continue;
        const currentM = masteryMap[node.id] ?? 0;
        if (currentM < 0.85) {
          const { satisfied } = this.arePrerequisitesSatisfied(node.id, masteryMap, threshold);
          if (satisfied) candidates.push(node);
        }
      }
      candidates.sort((a, b) => a.difficultyBase - b.difficultyBase);
    }

    return candidates;
  }

  /**
   * Validates that the curriculum graph is strictly acyclic (DAG).
   */
  validateAcyclicity(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const prereqs = this.getPrerequisites(nodeId);
      for (const p of prereqs) {
        if (!visited.has(p)) {
          if (hasCycle(p)) return true;
        } else if (recStack.has(p)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) return false;
      }
    }

    return true;
  }
}
