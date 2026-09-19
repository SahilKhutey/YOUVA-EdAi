import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  MasterLoopStage,
  MasterLoopState,
  OperatingScorecard,
  ReleaseBlockerCategory,
  ReleaseGateEvaluation,
} from './n-infinity-types';
import * as crypto from 'crypto';

export const MASTER_LOOP_SEQUENCE: MasterLoopStage[] = [
  'OBSERVE',
  'UNDERSTAND',
  'LEARN',
  'PRACTICE',
  'DEMONSTRATE',
  'ASSESS',
  'VALIDATE',
  'BUILD_CAPABILITY',
  'TRANSFER',
  'APPLY',
  'CREATE',
  'CONTRIBUTE',
  'TEACH',
  'REFLECT',
  'MEASURE',
  'VERIFY',
  'IMPROVE',
  'REVALIDATE',
];

export const ALL_RELEASE_BLOCKER_CATEGORIES: ReleaseBlockerCategory[] = [
  'CONSENT_BYPASS',
  'SAFETY_BYPASS',
  'MASTERY_CORRUPTION',
  'EVIDENCE_CORRUPTION',
  'CREDENTIAL_CORRUPTION',
  'UNAUTHORIZED_AI_ACTION',
  'IDENTITY_COMPROMISE',
  'MATERIAL_PRIVACY_VIOLATION',
  'UNCONTROLLED_SURVEILLANCE',
  'UNVALIDATED_CONSEQUENTIAL_DECISION',
  'CRITICAL_SECURITY_VULNERABILITY',
  'MATERIAL_EDUCATIONAL_REGRESSION',
  'FABRICATED_EVIDENCE',
  'RESEARCH_INTEGRITY_FAILURE',
];

@Injectable()
export class CivilizationOperatingSystemService {
  private readonly masterLoops = new Map<string, MasterLoopState>();
  private readonly scorecards: OperatingScorecard[] = [];
  private readonly releaseGateEvaluations = new Map<string, ReleaseGateEvaluation>();

  constructor() {
    // Initialize default benchmark scorecard
    this.recordOperatingScorecard({
      learningScore: 94.5,
      capabilityScore: 92.8,
      trustScore: 98.2,
      safetyScore: 99.7,
      sustainabilityScore: 95.0,
    });
  }

  // ==========================================
  // 1. 18-STAGE MASTER LOOP EXECUTION
  // Clauses N∞.4 & N∞.64
  // ==========================================

  initializeMasterLoop(learnerId: string): MasterLoopState {
    if (!learnerId || typeof learnerId !== 'string' || !learnerId.trim()) {
      throw new BadRequestException('Valid learnerId is required to initialize Master Loop');
    }

    const executionId = `loop_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const state: MasterLoopState = {
      executionId,
      learnerId: learnerId.trim(),
      currentStage: 'OBSERVE',
      completedStages: [],
      artifacts: [],
      loopIteration: 1,
      updatedAt: now,
    };

    this.masterLoops.set(executionId, state);
    return state;
  }

  advanceMasterLoopStage(
    executionId: string,
    nextStage: MasterLoopStage,
    artifactUri?: string,
  ): MasterLoopState {
    const state = this.masterLoops.get(executionId);
    if (!state) {
      throw new NotFoundException(`Master Loop execution ${executionId} not found`);
    }

    const currentIndex = MASTER_LOOP_SEQUENCE.indexOf(state.currentStage);
    const nextIndex = MASTER_LOOP_SEQUENCE.indexOf(nextStage);

    if (nextIndex === -1) {
      throw new BadRequestException(`Invalid master loop stage: ${nextStage}`);
    }

    // Progression logic:
    // 1. Normal step forward: nextIndex === currentIndex + 1
    // 2. Loop restart after REVALIDATE: currentIndex === 17 and nextStage === 'OBSERVE'
    const isNormalProgression = nextIndex === currentIndex + 1;
    const isRestartProgression =
      state.currentStage === 'REVALIDATE' && nextStage === 'OBSERVE';

    if (!isNormalProgression && !isRestartProgression) {
      throw new BadRequestException(
        `Invalid stage transition from ${state.currentStage} to ${nextStage}. Transitions must follow the sequential 18-stage loop order.`,
      );
    }

    // Mark current stage completed if not already in completedStages
    if (!state.completedStages.includes(state.currentStage)) {
      state.completedStages.push(state.currentStage);
    }

    const now = new Date().toISOString();

    if (artifactUri) {
      state.artifacts.push({
        stage: state.currentStage,
        uri: artifactUri,
        timestamp: now,
      });
    }

    if (isRestartProgression) {
      state.loopIteration += 1;
      state.completedStages = [];
    }

    state.currentStage = nextStage;
    state.updatedAt = now;

    this.masterLoops.set(executionId, state);
    return state;
  }

  recordLoopArtifact(
    executionId: string,
    stage: MasterLoopStage,
    uri: string,
  ): MasterLoopState {
    const state = this.masterLoops.get(executionId);
    if (!state) {
      throw new NotFoundException(`Master Loop execution ${executionId} not found`);
    }

    if (!uri || !uri.trim()) {
      throw new BadRequestException('Artifact URI cannot be empty');
    }

    state.artifacts.push({
      stage,
      uri: uri.trim(),
      timestamp: new Date().toISOString(),
    });

    state.updatedAt = new Date().toISOString();
    this.masterLoops.set(executionId, state);
    return state;
  }

  getMasterLoopState(executionId: string): MasterLoopState {
    const state = this.masterLoops.get(executionId);
    if (!state) {
      throw new NotFoundException(`Master Loop execution ${executionId} not found`);
    }
    return state;
  }

  listLearnerLoops(learnerId: string): MasterLoopState[] {
    return Array.from(this.masterLoops.values()).filter(
      (l) => l.learnerId === learnerId,
    );
  }

  // ==========================================
  // 2. 14 CONTINUOUS RELEASE GATES
  // Clause N∞.60
  // ==========================================

  evaluateReleaseGates(
    releaseTag: string,
    simulatedFindings?: Array<{
      category: ReleaseBlockerCategory;
      triggered: boolean;
      details?: string;
    }>,
  ): ReleaseGateEvaluation {
    if (!releaseTag || !releaseTag.trim()) {
      throw new BadRequestException('Release tag is required');
    }

    const findingMap = new Map<ReleaseBlockerCategory, { triggered: boolean; details?: string }>();
    if (simulatedFindings) {
      for (const f of simulatedFindings) {
        findingMap.set(f.category, {
          triggered: f.triggered,
          details: f.details,
        });
      }
    }

    const evaluations: Array<{
      category: ReleaseBlockerCategory;
      passed: boolean;
      details: string;
    }> = [];

    const blockersTriggered: ReleaseBlockerCategory[] = [];

    for (const category of ALL_RELEASE_BLOCKER_CATEGORIES) {
      const finding = findingMap.get(category);
      const isTriggered = finding ? finding.triggered : false;

      if (isTriggered) {
        blockersTriggered.push(category);
        evaluations.push({
          category,
          passed: false,
          details: finding?.details || `Blocked: Active failure detected in ${category}`,
        });
      } else {
        evaluations.push({
          category,
          passed: true,
          details: `Passed: Zero violations detected for ${category}`,
        });
      }
    }

    const evaluation: ReleaseGateEvaluation = {
      releaseTag: releaseTag.trim(),
      isBlocked: blockersTriggered.length > 0,
      blockersTriggered,
      evaluations,
      evaluatedAt: new Date().toISOString(),
    };

    this.releaseGateEvaluations.set(releaseTag.trim(), evaluation);
    return evaluation;
  }

  getReleaseGateEvaluation(releaseTag: string): ReleaseGateEvaluation {
    const evaluation = this.releaseGateEvaluations.get(releaseTag);
    if (!evaluation) {
      throw new NotFoundException(`Release gate evaluation for ${releaseTag} not found`);
    }
    return evaluation;
  }

  listReleaseGateEvaluations(): ReleaseGateEvaluation[] {
    return Array.from(this.releaseGateEvaluations.values());
  }

  // ==========================================
  // 3. 5-DIMENSION OPERATING SCORECARD
  // Clause N∞.61
  // ==========================================

  recordOperatingScorecard(scores: {
    learningScore: number;
    capabilityScore: number;
    trustScore: number;
    safetyScore: number;
    sustainabilityScore: number;
  }): OperatingScorecard {
    const { learningScore, capabilityScore, trustScore, safetyScore, sustainabilityScore } = scores;

    for (const [key, val] of Object.entries(scores)) {
      if (typeof val !== 'number' || val < 0 || val > 100) {
        throw new BadRequestException(`${key} must be a number between 0 and 100`);
      }
    }

    // Weighted composite: Learning 25%, Capability 25%, Trust 20%, Safety 20%, Sustainability 10%
    const compositeHealthIndex = Number(
      (
        learningScore * 0.25 +
        capabilityScore * 0.25 +
        trustScore * 0.20 +
        safetyScore * 0.20 +
        sustainabilityScore * 0.10
      ).toFixed(2),
    );

    const scorecard: OperatingScorecard = {
      scorecardId: `sc_${crypto.randomBytes(8).toString('hex')}`,
      learningScore,
      capabilityScore,
      trustScore,
      safetyScore,
      sustainabilityScore,
      compositeHealthIndex,
      evaluatedAt: new Date().toISOString(),
    };

    this.scorecards.push(scorecard);
    return scorecard;
  }

  getLatestScorecard(): OperatingScorecard {
    if (this.scorecards.length === 0) {
      throw new NotFoundException('No operating scorecards recorded yet');
    }
    return this.scorecards[this.scorecards.length - 1];
  }

  getScorecardHistory(): OperatingScorecard[] {
    return [...this.scorecards];
  }

  checkScorecardThresholds(scorecard: OperatingScorecard): {
    healthy: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    if (scorecard.learningScore < 70) warnings.push('Learning score below 70 threshold');
    if (scorecard.capabilityScore < 70) warnings.push('Capability score below 70 threshold');
    if (scorecard.trustScore < 80) warnings.push('Trust score below 80 threshold');
    if (scorecard.safetyScore < 95) warnings.push('Safety score below 95 threshold');
    if (scorecard.sustainabilityScore < 70) warnings.push('Sustainability score below 70 threshold');
    if (scorecard.compositeHealthIndex < 80) warnings.push('Composite health index below 80 threshold');

    return {
      healthy: warnings.length === 0,
      warnings,
    };
  }
}
