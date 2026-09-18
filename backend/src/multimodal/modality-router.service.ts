import { Injectable, Logger } from '@nestjs/common';
import {
  LearningModality,
  ModalityRecommendationRequest,
  ModalityRecommendationResponse,
  ModalityEquivalenceOption,
} from './multimodal-types';

@Injectable()
export class ModalityRouterService {
  private readonly logger = new Logger(ModalityRouterService.name);

  // Concept-to-modality affinity map (Grade 8 Math & Science)
  private readonly CONCEPT_PRIMARY_AFFINITY: Record<string, LearningModality> = {
    'fraction-fundamentals': 'IMAGE',
    'rational-number-def': 'TEXT',
    'number-line-representation': 'INTERACTIVE',
    'rational-multiplication': 'TEXT',
    'rational-word-problems': 'TEXT',
    'living-organisms-overview': 'IMAGE',
    'cell-discovery-and-theory': 'TEXT',
    'cell-structure-components': 'IMAGE',
    'cell-membrane-and-wall': 'VIDEO',
    'nucleus-and-cytoplasm': 'IMAGE',
    'plant-vs-animal-cells': 'IMAGE',
    'geometry-quadrilaterals': 'IMAGE',
    'cell-structure-and-functions': 'IMAGE',
    'chemical-reactions-combustion': 'VIDEO',
    'sound-production': 'AUDIO',
    'sound-production-vibrations': 'AUDIO',
  };

  /**
   * Governed Modality Decision Engine (N11.5, N11.6).
   * Determines the optimal modality based on learning objective, learner state,
   * accessibility, and cost/bandwidth constraints without relying on superficial learning-style stereotypes.
   */
  recommendModality(request: ModalityRecommendationRequest): ModalityRecommendationResponse {
    const rationale: string[] = [];
    let selectedModality: LearningModality = 'TEXT';
    let confidence = 0.85;

    // 1. Accessibility Overrides (N11.26: highest precedence)
    const accessReqs = request.accessibilityRequirements || [];
    if (accessReqs.includes('VISUAL_IMPAIRMENT') || accessReqs.includes('SCREEN_READER')) {
      selectedModality = 'AUDIO';
      confidence = 0.95;
      rationale.push('Accessibility priority: Auditory narration selected for screen-reader/visual support');
    } else if (accessReqs.includes('HEARING_IMPAIRMENT')) {
      selectedModality = 'IMAGE';
      confidence = 0.95;
      rationale.push('Accessibility priority: Visual diagram with closed captions selected for hearing support');
    } else if (accessReqs.includes('REDUCED_MOTION')) {
      selectedModality = 'IMAGE';
      confidence = 0.90;
      rationale.push('Accessibility priority: Static diagram selected to avoid motion discomfort');
    } else if (request.isLowBandwidth) {
      // 2. Low-Bandwidth Constraint (N11.53)
      selectedModality = 'TEXT';
      confidence = 0.90;
      rationale.push('Bandwidth optimization: Light-weight text explanation selected for low-connectivity');
    } else {
      // 3. Learner State & Pedagogical Evidence (N11.6)
      const baseConceptModality = this.CONCEPT_PRIMARY_AFFINITY[request.conceptId] || 'TEXT';

      // If learner has low mastery on text explanations (< 0.60), pivot to visual/interactive
      if (request.learnerMastery < 0.60 && baseConceptModality === 'TEXT') {
        selectedModality = 'IMAGE';
        confidence = 0.88;
        rationale.push(`Remediation pivot: Learner mastery (${request.learnerMastery}) benefits from visual schema`);
      } else if (request.recentModalitySuccess && request.recentModalitySuccess['INTERACTIVE'] > 0.80) {
        selectedModality = 'INTERACTIVE';
        confidence = 0.90;
        rationale.push('Empirical success: High learner transfer demonstrated on interactive manipulation');
      } else {
        selectedModality = baseConceptModality;
        rationale.push(`Curriculum affinity: Concept ${request.conceptId} aligns optimally with ${selectedModality}`);
      }
    }

    // 4. Generate Modality Equivalence Options (N11.29)
    const equivalentPaths = this.generateEquivalencePaths(request.conceptId, selectedModality);

    return {
      recommendedModality: selectedModality,
      confidence,
      rationale,
      equivalentPaths,
      offlineCachedAvailable: true,
    };
  }

  /**
   * Generates parallel equivalent learning pathways (Read, Listen, Watch, Explore) (N11.29).
   */
  generateEquivalencePaths(conceptId: string, primary: LearningModality): ModalityEquivalenceOption[] {
    const options: ModalityEquivalenceOption[] = [
      {
        modality: 'TEXT',
        title: 'Read: Guided Explanatory Text',
        description: 'Clear, formatted instructional explanation with key terminology callouts.',
        estimatedDurationMin: 4,
        accessibilityFeatures: ['SCREEN_READER_SEMANTICS', 'HIGH_CONTRAST', 'ADJUSTABLE_FONT'],
      },
      {
        modality: 'IMAGE',
        title: 'Explore: Detailed Labeled Diagram',
        description: 'High-resolution diagram with structured callouts and visual relationships.',
        estimatedDurationMin: 3,
        accessibilityFeatures: ['ALT_TEXT', 'TACTILE_DESCRIPTION', 'ZOOMABLE'],
      },
      {
        modality: 'AUDIO',
        title: 'Listen: Narrated Walkthrough',
        description: 'Complete voice explanation with clear pronunciation and synchronized transcript.',
        estimatedDurationMin: 3,
        accessibilityFeatures: ['SYNCHRONIZED_TRANSCRIPT', 'SPEED_CONTROL', 'PAUSE_RESUME'],
      },
      {
        modality: 'VIDEO',
        title: 'Watch: Short Demonstration Clip',
        description: '35-second animated demonstration illustrating core mechanics.',
        estimatedDurationMin: 2,
        accessibilityFeatures: ['CLOSED_CAPTIONS', 'TRANSCRIPT', 'PAUSE_FRAME'],
      },
      {
        modality: 'VOICE',
        title: 'Speak: Socratic Dialogue',
        description: 'Interactive spoken question-and-answer verification.',
        estimatedDurationMin: 5,
        accessibilityFeatures: ['TEXT_FALLBACK', 'REPEAT_PROMPT', 'ACCENT_TOLERANCE'],
      },
    ];

    // Put primary recommendation first
    return options.sort((a, b) => (a.modality === primary ? -1 : b.modality === primary ? 1 : 0));
  }
}
