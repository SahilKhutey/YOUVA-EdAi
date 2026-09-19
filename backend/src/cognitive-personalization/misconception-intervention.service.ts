import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  MisconceptionPattern,
  ErrorCategory,
  InterventionRecord,
  InterventionType,
  HintProgressionLevel,
} from './n18-types';

@Injectable()
export class MisconceptionInterventionService {
  private readonly logger = new Logger(MisconceptionInterventionService.name);

  // In-memory misconception catalog: key = misconceptionId
  private readonly misconceptions = new Map<string, MisconceptionPattern>();

  // In-memory intervention library: key = interventionId
  private readonly interventions = new Map<string, InterventionRecord>();

  constructor() {
    this.seedDefaultMisconceptions();
    this.seedDefaultInterventions();
  }

  private seedDefaultMisconceptions(): void {
    const defaults: MisconceptionPattern[] = [
      {
        misconceptionId: 'MISC-FRAC-ADD-NUM',
        conceptId: 'MATH-FRAC-001',
        description: 'Adding numerators and denominators directly (a/b + c/d = (a+c)/(b+d))',
        errorCategory: 'CONCEPTUAL',
        evidenceRules: ['incorrect_sum_numerator_denominator', 'missing_common_denominator'],
        validationActivities: ['ACT-FRAC-DIAG-COMMON-DENOM', 'ACT-FRAC-VISUAL-PIE'],
        confidence: 0.85,
        status: 'VALIDATED',
        observedCount: 48,
        diagnosticConfirmations: 5,
        lastObservedAt: '2026-09-12T10:00:00Z',
      },
      {
        misconceptionId: 'MISC-FORCE-MOTION',
        conceptId: 'SCI-PHYS-002',
        description: 'Believing sustained velocity requires constant net forward force',
        errorCategory: 'CONCEPTUAL',
        evidenceRules: ['constant_speed_assumes_force_gt_zero'],
        validationActivities: ['ACT-PHYS-ZERO-FRICTION-DIAG'],
        confidence: 0.90,
        status: 'VALIDATED',
        observedCount: 62,
        diagnosticConfirmations: 6,
        lastObservedAt: '2026-09-14T11:00:00Z',
      },
      {
        misconceptionId: 'MISC-CALC-SIGN-FLIP',
        conceptId: 'MATH-FRAC-001',
        description: 'Sign flip error when distributing negative fractions',
        errorCategory: 'CALCULATION',
        evidenceRules: ['negative_sign_omission'],
        validationActivities: ['ACT-FRAC-SIGN-CHECK'],
        confidence: 0.40,
        status: 'CANDIDATE',
        observedCount: 1,
        diagnosticConfirmations: 1, // Only 1 observation -> CANDIDATE
        lastObservedAt: '2026-09-15T08:00:00Z',
      },
    ];

    for (const m of defaults) {
      this.misconceptions.set(m.misconceptionId, m);
    }
  }

  private seedDefaultInterventions(): void {
    const defaults: InterventionRecord[] = [
      {
        interventionId: 'INT-FRAC-VIS-01',
        conceptId: 'MATH-FRAC-001',
        type: 'VISUAL_EXPLANATION',
        title: 'Interactive Fraction Strips & Area Model Comparison',
        targetMisconceptionId: 'MISC-FRAC-ADD-NUM',
        estimatedLearningGain: 0.82,
        learnerAgencyRating: 0.85,
        teacherFitRating: 0.90,
        accessibilityScore: 0.95,
        costIndex: 0.10,
        compositeRankScore: 84.5,
        activeStatus: true,
      },
      {
        interventionId: 'INT-FRAC-COUNTER-02',
        conceptId: 'MATH-FRAC-001',
        type: 'COUNTEREXAMPLE',
        title: 'Extreme Case Counterexample: 1/2 + 1/2 ≠ 2/4',
        targetMisconceptionId: 'MISC-FRAC-ADD-NUM',
        estimatedLearningGain: 0.88,
        learnerAgencyRating: 0.80,
        teacherFitRating: 0.92,
        accessibilityScore: 0.90,
        costIndex: 0.05,
        compositeRankScore: 87.2,
        activeStatus: true,
      },
      {
        interventionId: 'INT-PHYS-SIM-03',
        conceptId: 'SCI-PHYS-002',
        type: 'WORKED_EXAMPLE',
        title: 'Deep Space Puck Zero-Resistance Vector Sandbox',
        targetMisconceptionId: 'MISC-FORCE-MOTION',
        estimatedLearningGain: 0.85,
        learnerAgencyRating: 0.88,
        teacherFitRating: 0.85,
        accessibilityScore: 0.90,
        costIndex: 0.15,
        compositeRankScore: 83.9,
        activeStatus: true,
      },
      {
        interventionId: 'INT-META-REFLECT-04',
        conceptId: 'MATH-FRAC-001',
        type: 'METACOGNITIVE_REFLECTION',
        title: 'Self-Explanation Prompt: Why Does Denominator Represent Part Size?',
        targetMisconceptionId: 'MISC-FRAC-ADD-NUM',
        estimatedLearningGain: 0.79,
        learnerAgencyRating: 0.95,
        teacherFitRating: 0.88,
        accessibilityScore: 0.90,
        costIndex: 0.05,
        compositeRankScore: 85.1,
        activeStatus: true,
      },
    ];

    for (const i of defaults) {
      this.interventions.set(i.interventionId, i);
    }
  }

  // --- MISCONCEPTION LIFECYCLE API ---

  getMisconceptions(): MisconceptionPattern[] {
    return Array.from(this.misconceptions.values());
  }

  getMisconceptionsByConcept(conceptId: string): MisconceptionPattern[] {
    return Array.from(this.misconceptions.values()).filter((m) => m.conceptId === conceptId);
  }

  /**
   * Records candidate misconception hypothesis (Clause N18.14–N18.16).
   * Invariant: Single wrong answer NEVER labels as permanent misconception.
   * Starts as CANDIDATE; requires 3 confirmations to become VALIDATED.
   */
  recordMisconceptionObservation(
    conceptId: string,
    misconceptionId: string,
    description: string,
    category: ErrorCategory,
  ): MisconceptionPattern {
    let pattern = this.misconceptions.get(misconceptionId);

    if (!pattern) {
      pattern = {
        misconceptionId,
        conceptId,
        description,
        errorCategory: category,
        evidenceRules: [`observed_${category.toLowerCase()}_error`],
        validationActivities: [`ACT-VALIDATE-${misconceptionId}`],
        confidence: 0.35, // Initial tentative confidence
        status: 'CANDIDATE',
        observedCount: 1,
        diagnosticConfirmations: 1,
        lastObservedAt: new Date().toISOString(),
      };
      this.misconceptions.set(misconceptionId, pattern);
      this.logger.log(`[MISCONCEPTION-CANDIDATE] Formulated hypothesis ${misconceptionId} for concept ${conceptId}`);
    } else {
      pattern.observedCount += 1;
      pattern.diagnosticConfirmations += 1;
      pattern.confidence = Number(Math.min(0.98, pattern.confidence + 0.20).toFixed(2));
      pattern.lastObservedAt = new Date().toISOString();

      // Multi-Event Confirmation Gate (Clause N18.16):
      // Transitions to VALIDATED only after >= 3 diagnostic confirmations
      if (pattern.diagnosticConfirmations >= 3 && pattern.status === 'CANDIDATE') {
        pattern.status = 'VALIDATED';
        this.logger.log(
          `[MISCONCEPTION-VALIDATED] Hypothesis ${misconceptionId} confirmed with ${pattern.diagnosticConfirmations} observations.`,
        );
      }
    }

    return pattern;
  }

  /**
   * Retires a misconception pattern if proven obsolete or falsified.
   */
  retireMisconception(misconceptionId: string): MisconceptionPattern {
    const pattern = this.misconceptions.get(misconceptionId);
    if (!pattern) throw new NotFoundException(`Misconception ${misconceptionId} not found`);

    pattern.status = 'RETIRED';
    return pattern;
  }

  // --- INTERVENTION LIBRARY & MULTI-CONSTRAINT RANKING API ---

  getInterventions(): InterventionRecord[] {
    return Array.from(this.interventions.values());
  }

  /**
   * Multi-Constraint Intervention Ranking (Clause N18.21, N18.53).
   * Ranks interventions considering learning gain, agency, teacher fit, accessibility, and cost.
   */
  rankInterventions(
    conceptId: string,
    targetMisconceptionId?: string,
    teacherPrefersVisual: boolean = false,
  ): InterventionRecord[] {
    const matching = Array.from(this.interventions.values()).filter(
      (i) => i.conceptId === conceptId && i.activeStatus,
    );

    for (const item of matching) {
      let score =
        item.estimatedLearningGain * 35 +
        item.learnerAgencyRating * 25 +
        item.teacherFitRating * 20 +
        item.accessibilityScore * 15 -
        item.costIndex * 5;

      // Targeted misconception boost
      if (targetMisconceptionId && item.targetMisconceptionId === targetMisconceptionId) {
        score += 15;
      }

      // Teacher preference alignment
      if (teacherPrefersVisual && item.type === 'VISUAL_EXPLANATION') {
        score += 10;
      }

      item.compositeRankScore = Number(score.toFixed(1));
    }

    return matching.sort((a, b) => b.compositeRankScore - a.compositeRankScore);
  }

  // --- 5-TIER HINT PROGRESSION STATE MACHINE (Clause N18.38) ---

  /**
   * Evaluates next hint level following the pedagogical progression:
   * CONCEPTUAL -> STRATEGIC -> PARTIAL_SCAFFOLD -> WORKED_EXAMPLE -> ANSWER_EXPLANATION
   */
  getNextHintLevel(currentLevel?: HintProgressionLevel): {
    nextLevel: HintProgressionLevel;
    allowDirectAnswer: boolean;
    scaffoldingDescription: string;
  } {
    switch (currentLevel) {
      case 'CONCEPTUAL':
        return {
          nextLevel: 'STRATEGIC',
          allowDirectAnswer: false,
          scaffoldingDescription: 'Strategic heuristic reminder (e.g. Find common denominator first).',
        };
      case 'STRATEGIC':
        return {
          nextLevel: 'PARTIAL_SCAFFOLD',
          allowDirectAnswer: false,
          scaffoldingDescription: 'First step structured (e.g. 1/2 = 2/4; now rewrite 1/4).',
        };
      case 'PARTIAL_SCAFFOLD':
        return {
          nextLevel: 'WORKED_EXAMPLE',
          allowDirectAnswer: false,
          scaffoldingDescription: 'Analogous solved problem with different numerical values.',
        };
      case 'WORKED_EXAMPLE':
        return {
          nextLevel: 'ANSWER_EXPLANATION',
          allowDirectAnswer: true,
          scaffoldingDescription: 'Complete solution walkthrough with conceptual rationale.',
        };
      case 'ANSWER_EXPLANATION':
      default:
        return {
          nextLevel: 'CONCEPTUAL',
          allowDirectAnswer: false,
          scaffoldingDescription: 'Broad conceptual principle reminder.',
        };
    }
  }
}
