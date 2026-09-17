import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  LearnerLearningState,
  LearningDecisionExplanation,
  DecisionFactor,
} from './personalization-types';
import { KnowledgeGraphService, ConceptNode } from './knowledge-graph.service';
import { PersonalizationPolicyService } from './personalization-policy.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

export interface RecommendationRequest {
  learnerState: LearnerLearningState;
  subject?: 'MATH' | 'SCIENCE';
}

export interface RecommendationResponse {
  selectedActivityId: string;
  conceptId: string;
  activityTitle: string;
  activityType: 'INSTRUCTION' | 'PRACTICE' | 'REMEDIATION' | 'EXTENSION' | 'SPACED_RETRIEVAL';
  difficulty: number;
  explanation: LearningDecisionExplanation;
  adaptationConfidence: number;
  adaptationPath: 'FULL_PERSONALIZATION' | 'CONSERVATIVE' | 'SAFE_STANDARD_PATHWAY';
}

@Injectable()
export class PersonalizationEngineService {
  private readonly logger = new Logger(PersonalizationEngineService.name);

  constructor(
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly policyService: PersonalizationPolicyService,
    private readonly spacedRepetition: SpacedRepetitionService,
  ) {}

  /**
   * Computes multi-evidence mastery (N10.5) combining correctness, recency, difficulty,
   * retention, transfer, and teacher observations.
   */
  computeMultiEvidenceMastery(params: {
    correctness: number; // 0.0 to 1.0
    recencyWeight?: number; // 0.0 to 1.0
    difficulty: number; // 0.1 to 0.9
    retentionScore?: number; // 0.0 to 1.0
    transferScore?: number; // 0.0 to 1.0
    teacherWeight?: number; // 0.0 to 1.0
  }): number {
    const wC = 0.40;
    const wR = 0.15;
    const wD = 0.15;
    const wRet = 0.10;
    const wTrans = 0.10;
    const wT = 0.10;

    const rawCorrectness = Number(params.correctness);
    const correctness = Number.isNaN(rawCorrectness) ? 0.0 : Math.min(1.0, Math.max(0.0, rawCorrectness));
    const rawDifficulty = Number(params.difficulty);
    const difficulty = Number.isNaN(rawDifficulty) ? 0.5 : Math.min(1.0, Math.max(0.1, rawDifficulty));
    const recency = Number.isNaN(Number(params.recencyWeight)) ? 0.85 : (params.recencyWeight ?? 0.85);
    const retention =
      params.retentionScore !== undefined && !Number.isNaN(Number(params.retentionScore))
        ? Math.min(1.0, Math.max(0.0, Number(params.retentionScore)))
        : 0.5;
    const transfer =
      params.transferScore !== undefined && !Number.isNaN(Number(params.transferScore))
        ? Math.min(1.0, Math.max(0.0, Number(params.transferScore)))
        : 0.5;
    const teacher =
      params.teacherWeight !== undefined && !Number.isNaN(Number(params.teacherWeight))
        ? Math.min(1.0, Math.max(0.0, Number(params.teacherWeight)))
        : 0.5;

    const weightedScore =
      wC * correctness +
      wR * recency +
      wD * difficulty +
      wRet * retention +
      wTrans * transfer +
      wT * teacher;

    return Math.round(Math.min(1.0, Math.max(0.0, weightedScore)) * 1000) / 1000;
  }

  /**
   * Calculates evidence confidence C in [0.0, 1.0] based on attempt volume (N10.7).
   * C = 1.0 - 1.0 / sqrt(attemptCount + 1)
   */
  calculateEvidenceConfidence(attemptCount: number): number {
    if (attemptCount <= 0) return 0.0;
    const confidence = 1.0 - 1.0 / Math.sqrt(attemptCount + 1);
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Evaluates the Personalization Confidence Gate (N10.30).
   */
  evaluateConfidenceGate(confidence: number): 'FULL_PERSONALIZATION' | 'CONSERVATIVE' | 'SAFE_STANDARD_PATHWAY' {
    if (confidence >= 0.70) return 'FULL_PERSONALIZATION';
    if (confidence >= 0.40) return 'CONSERVATIVE';
    return 'SAFE_STANDARD_PATHWAY';
  }

  /**
   * Governed Personalization Decision Engine (N10.8):
   * Selects and ranks candidate activities deterministically with an explainable audit record.
   */
  recommendActivity(request: RecommendationRequest): RecommendationResponse {
    const startTime = Date.now();
    const { learnerState } = request;
    const policy = this.policyService.getActivePolicy();
    const factors: DecisionFactor[] = [];

    // Auto-detect subject if not explicitly specified
    let subject = request.subject;
    if (!subject) {
      const keys = [
        ...Object.keys(learnerState.conceptMastery || {}),
        ...Object.keys(learnerState.evidenceConfidence || {}),
        ...Object.keys(learnerState.retentionRisk || {}),
      ];
      const hasScience = keys.some(
        (k) =>
          k.startsWith('cell-') ||
          k.startsWith('living-') ||
          k.startsWith('plant-') ||
          k.startsWith('nucleus-'),
      );
      const hasMath = keys.some(
        (k) =>
          k.startsWith('rational-') ||
          k.startsWith('fraction-') ||
          k.startsWith('integers-') ||
          k.startsWith('reciprocals-') ||
          k.startsWith('distributive-') ||
          k.startsWith('number-line-'),
      );
      if (hasScience && !hasMath) {
        subject = 'SCIENCE';
      } else if (hasMath && !hasScience) {
        subject = 'MATH';
      }
    }

    // 1. Identify Candidate Concepts from Knowledge Graph
    const candidates = this.knowledgeGraph.getAvailableCandidates(
      learnerState.conceptMastery,
      0.70,
      subject,
    );

    if (candidates.length === 0) {
      // All concepts mastered or graph empty: return extension
      return this.fallbackExtension(learnerState, policy.version);
    }

    // Check if any concept has high retention risk (>= 0.60) needing spaced retrieval
    const highRiskConceptId = Object.keys(learnerState.retentionRisk || {}).find(
      (cid) => (learnerState.retentionRisk[cid] ?? 0) >= 0.60,
    );

    // Select primary candidate node (prioritizing high retention risk concept if flagged)
    let targetNode: ConceptNode =
      highRiskConceptId && this.knowledgeGraph.getNode(highRiskConceptId)
        ? this.knowledgeGraph.getNode(highRiskConceptId)!
        : candidates[0];

    let selectedType: 'INSTRUCTION' | 'PRACTICE' | 'REMEDIATION' | 'EXTENSION' | 'SPACED_RETRIEVAL' = 'PRACTICE';
    let difficulty = targetNode.difficultyBase;

    const currentMastery = learnerState.conceptMastery[targetNode.id] ?? 0.0;
    const currentConfidence = learnerState.evidenceConfidence[targetNode.id] ?? 0.0;
    const confidenceGate = this.evaluateConfidenceGate(currentConfidence);

    // 2. Check for Spaced Repetition / Retention Risk (N10.14)
    if (highRiskConceptId && targetNode.id === highRiskConceptId) {
      selectedType = 'SPACED_RETRIEVAL';
      factors.push({
        factor: 'High retention risk detected on prior concept',
        direction: 'positive',
        weight: 0.85,
      });
    } else if (currentMastery < policy.remediationThreshold) {
      // 3. Remediation Check
      selectedType = 'REMEDIATION';
      difficulty = Math.max(0.1, difficulty - 0.15); // Scale down difficulty
      factors.push({
        factor: `Concept mastery (${currentMastery}) below remediation threshold (${policy.remediationThreshold})`,
        direction: 'positive',
        weight: 0.90,
      });
    } else if (currentMastery >= policy.extensionThreshold && confidenceGate === 'FULL_PERSONALIZATION') {
      // 4. Extension Check
      selectedType = 'EXTENSION';
      difficulty = Math.min(0.9, difficulty + policy.maxDifficultyJump);
      factors.push({
        factor: `Mastery (${currentMastery}) qualified for extension challenges`,
        direction: 'positive',
        weight: 0.75,
      });
    } else {
      // Standard or Guided Practice
      selectedType = currentMastery < policy.guidedPracticeThreshold ? 'INSTRUCTION' : 'PRACTICE';
      factors.push({
        factor: 'Prerequisite readiness verified across curriculum graph',
        direction: 'positive',
        weight: 0.80,
      });
    }

    // 5. Confidence Gate Adjustments (N10.30)
    if (confidenceGate === 'SAFE_STANDARD_PATHWAY') {
      difficulty = targetNode.difficultyBase; // Lock strictly to baseline difficulty
      factors.push({
        factor: `Sparse evidence (confidence ${currentConfidence}); defaulting to safe standard pathway`,
        direction: 'negative',
        weight: 0.95,
      });
    }

    // 6. Formulate Decision Explanation (N10.9)
    const decisionId = `DEC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const explanation: LearningDecisionExplanation = {
      decisionId,
      learnerId: learnerState.learnerId,
      selectedActivityId: `act-${targetNode.id}-${selectedType.toLowerCase()}`,
      activityTitle: `${targetNode.title} (${selectedType})`,
      reasons: factors,
      policyVersion: policy.version,
      createdAt: new Date().toISOString(),
    };

    const latencyMs = Date.now() - startTime;
    this.logger.debug(`Personalization decision generated in ${latencyMs}ms for ${learnerState.learnerId}: ${explanation.activityTitle}`);

    return {
      selectedActivityId: explanation.selectedActivityId,
      conceptId: targetNode.id,
      activityTitle: explanation.activityTitle,
      activityType: selectedType,
      difficulty,
      explanation,
      adaptationConfidence: currentConfidence,
      adaptationPath: confidenceGate,
    };
  }

  private fallbackExtension(learnerState: LearnerLearningState, policyVersion: string): RecommendationResponse {
    const decisionId = `DEC-CAPSTONE-${Date.now()}`;
    return {
      selectedActivityId: 'act-rational-word-problems-extension',
      conceptId: 'rational-word-problems',
      activityTitle: 'Rational Numbers Capstone Extension',
      activityType: 'EXTENSION',
      difficulty: 0.85,
      explanation: {
        decisionId,
        learnerId: learnerState.learnerId,
        selectedActivityId: 'act-rational-word-problems-extension',
        activityTitle: 'Rational Numbers Capstone Extension',
        reasons: [{ factor: 'All foundational concepts mastered', direction: 'positive', weight: 1.0 }],
        policyVersion,
        createdAt: new Date().toISOString(),
      },
      adaptationConfidence: 1.0,
      adaptationPath: 'FULL_PERSONALIZATION',
    };
  }
}
