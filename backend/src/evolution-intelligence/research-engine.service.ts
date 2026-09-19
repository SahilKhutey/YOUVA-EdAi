import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ResearchTrackId,
  ResearchMethodology,
  ResearchStudyRecord,
  EvidenceGapRecord,
  LearningModelRecord,
  ModelAlgorithmFamily,
  ModelPromotionStage,
  LearningPolicyRecord,
} from './n17-types';

@Injectable()
export class ResearchEngineService {
  private readonly logger = new Logger(ResearchEngineService.name);

  // In-memory study registry
  private readonly studies = new Map<string, ResearchStudyRecord>();

  // In-memory evidence gap registry
  private readonly evidenceGaps = new Map<string, EvidenceGapRecord>();

  // In-memory personalization models
  private readonly models = new Map<string, LearningModelRecord>();

  // In-memory learning policy registry
  private readonly policies = new Map<string, LearningPolicyRecord>();

  constructor() {
    this.seedResearchTracks();
    this.seedEvidenceGaps();
    this.seedModelCompetition();
    this.seedPolicies();
  }

  private seedResearchTracks(): void {
    const defaultStudies: ResearchStudyRecord[] = [
      {
        studyId: 'STUDY-R1-BKT-VS-DKT',
        trackId: 'R1',
        title: 'Empirical Comparison of BKT and Deep Knowledge Tracing on Elementary Fractions',
        hypothesis: 'DKT captures multi-step skill dependencies with higher AUC-ROC than BKT without overfitting',
        methodology: 'EXPERIMENTAL',
        targetPopulation: 'Grade 4-5 Elementary Learners (Ages 9-11)',
        sampleSize: 2400,
        cohortCriteria: ['enrolled_grade_4_5', 'active_days_gt_30', 'unassisted_assessments_gt_5'],
        comparator: 'Standard 4-parameter BKT Baseline',
        primaryOutcomeMetric: 'Next-Item Response Prediction AUC-ROC',
        effectSize: 0.14,
        pVal: 0.002,
        status: 'CONCLUDED',
        reproducibilityPackageHash: 'sha256:4a8c9e1b32df5684a0b29147e0bc235128e4619b0d1e564c7832ef8a76b539c0',
        limitations: ['Limited to fraction arithmetic; requires validation on geometry'],
        piName: 'Dr. Elena Rostova (Learning Sciences Lab)',
        createdAt: '2026-06-15T09:00:00Z',
        updatedAt: '2026-08-20T14:30:00Z',
      },
      {
        studyId: 'STUDY-R2-SPACED-INTERVAL',
        trackId: 'R2',
        title: 'Expanding vs Uniform Spaced Retrieval Intervals for Elementary Science Retention',
        hypothesis: 'Expanding retrieval intervals (1-3-7-14d) produce 25% higher 60-day retention than uniform 3-day reviews',
        methodology: 'EXPERIMENTAL',
        targetPopulation: 'Elementary Science Cohort (Ages 8-11)',
        sampleSize: 1850,
        cohortCriteria: ['science_curriculum_active', 'parent_consent_verified'],
        comparator: 'Uniform 3-day interval review',
        primaryOutcomeMetric: '60-Day Uncued Recall Score',
        effectSize: 0.28,
        pVal: 0.0001,
        status: 'PEER_REVIEW',
        reproducibilityPackageHash: 'sha256:7f3b2184d0c98e1a54b321a084efbc598213e4b789125634bc78e01456d9a8b1',
        limitations: ['School holiday breaks introduced variance in adherence'],
        piName: 'Prof. Marcus Thorne',
        createdAt: '2026-07-01T10:00:00Z',
        updatedAt: '2026-09-10T11:15:00Z',
      },
      {
        studyId: 'STUDY-R9-SCAFFOLD-OVERRELIANCE',
        trackId: 'R9',
        title: 'Effect of Progressive Hint Scaffolding on AI Overreliance and Independent Problem Solving',
        hypothesis: 'Mandatory reflection before hint delivery reduces answer-seeking behavior by >30% with no decrease in persistence',
        methodology: 'QUASI_EXPERIMENTAL',
        targetPopulation: 'Middle & High School Learners (Ages 12-16)',
        sampleSize: 3100,
        cohortCriteria: ['frequent_ai_tutor_users', 'stem_track'],
        comparator: 'Immediate hint delivery on request',
        primaryOutcomeMetric: 'Independent Problem Solving Rate Without AI Support',
        effectSize: 0.35,
        pVal: 0.0005,
        status: 'DATA_COLLECTION',
        limitations: ['Self-selection bias among voluntary tutor users'],
        piName: 'Dr. Aris Thorne & YOUVA Governance Board',
        createdAt: '2026-08-01T08:00:00Z',
        updatedAt: '2026-09-15T16:00:00Z',
      },
    ];

    for (const study of defaultStudies) {
      this.studies.set(study.studyId, study);
    }
  }

  private seedEvidenceGaps(): void {
    const defaultGaps: EvidenceGapRecord[] = [
      {
        gapId: 'GAP-EARLY-VOICE-001',
        conceptId: 'LANG-PHONICS-004',
        domain: 'Early Childhood Phonics',
        ageTier: '3-7',
        description: 'Lack of longitudinal retention evidence for synthetic speech vs real human voice prompts in early phonemic awareness',
        severity: 'HIGH',
        status: 'IDENTIFIED',
        identifiedAt: '2026-08-10T10:00:00Z',
      },
      {
        gapId: 'GAP-TRANSFER-GEOM-002',
        conceptId: 'MATH-GEOM-PROOF-003',
        domain: 'Secondary Geometry',
        ageTier: '13-18',
        description: 'Insufficient empirical validation for AI-guided step-wise geometry proof construction transfer to novel spatial domains',
        severity: 'MEDIUM',
        status: 'STUDY_ASSIGNED',
        assignedStudyId: 'STUDY-R8-GEOM-TRANSFER',
        identifiedAt: '2026-07-22T14:00:00Z',
      },
    ];

    for (const gap of defaultGaps) {
      this.evidenceGaps.set(gap.gapId, gap);
    }
  }

  private seedModelCompetition(): void {
    const defaultModels: LearningModelRecord[] = [
      {
        modelId: 'MODEL-BKT-PROD-V2',
        name: 'Bayesian Knowledge Tracing Production Model',
        algorithmFamily: 'BKT',
        version: '2.4.1',
        purpose: 'Single-skill mastery probability estimation with slip/guess modeling',
        population: 'General K-12 Population',
        inputs: ['student_id', 'skill_id', 'correctness_binary', 'prior_p_mastery'],
        outputs: ['posterior_p_mastery', 'slip_probability', 'guess_probability'],
        limitations: ['Cannot capture cross-skill transfer or multi-step dependencies'],
        evaluationResults: [
          { metric: 'AUC-ROC', score: 0.76, baselineScore: 0.70, sampleSize: 15000 },
          { metric: 'Accuracy', score: 0.74, baselineScore: 0.68, sampleSize: 15000 },
        ],
        safetyReviewId: 'SR-2026-001',
        approvedBy: 'YOUVA Model Governance Board',
        promotionStage: 'GA',
        status: 'APPROVED',
        accuracy: 0.74,
        aucRoc: 0.76,
        latencyMs: 12,
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-08-15T00:00:00Z',
      },
      {
        modelId: 'MODEL-DKT-SHADOW-V1',
        name: 'Deep Knowledge Tracing Sequence Model',
        algorithmFamily: 'DKT',
        version: '1.2.0',
        purpose: 'Multi-skill sequential response prediction using recurrent LSTM attention',
        population: 'Grades 6-12 STEM Cohort',
        inputs: ['interaction_sequence', 'time_lag', 'hint_count', 'attempt_number'],
        outputs: ['predicted_accuracy_vector', 'latent_knowledge_state'],
        limitations: ['Higher latency than BKT; requires at least 5 prior interactions'],
        evaluationResults: [
          { metric: 'AUC-ROC', score: 0.83, baselineScore: 0.76, sampleSize: 15000 },
          { metric: 'Accuracy', score: 0.81, baselineScore: 0.74, sampleSize: 15000 },
        ],
        safetyReviewId: 'SR-2026-018',
        approvedBy: 'Lead AI Researcher',
        promotionStage: 'SHADOW',
        status: 'SHADOW',
        accuracy: 0.81,
        aucRoc: 0.83,
        latencyMs: 45,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      {
        modelId: 'MODEL-IRT-PILOT-V1',
        name: 'Multidimensional Item Response Theory Engine',
        algorithmFamily: 'IRT',
        version: '1.0.4',
        purpose: 'Adaptive assessment item calibration and latent ability estimation (theta)',
        population: 'High School Standardized Prep (Grades 9-12)',
        inputs: ['item_difficulty_b', 'item_discrimination_a', 'response_binary'],
        outputs: ['learner_theta', 'standard_error_theta'],
        limitations: ['Requires pre-calibrated item parameter banks'],
        evaluationResults: [
          { metric: 'AUC-ROC', score: 0.79, baselineScore: 0.72, sampleSize: 8500 },
          { metric: 'Accuracy', score: 0.77, baselineScore: 0.71, sampleSize: 8500 },
        ],
        safetyReviewId: 'SR-2026-024',
        approvedBy: 'Assessment Psychometrician',
        promotionStage: 'CONTROLLED_PILOT',
        status: 'EXPERIMENTAL',
        accuracy: 0.77,
        aucRoc: 0.79,
        latencyMs: 18,
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-09-12T00:00:00Z',
      },
    ];

    for (const model of defaultModels) {
      this.models.set(model.modelId, model);
    }
  }

  private seedPolicies(): void {
    const defaultPolicy: LearningPolicyRecord = {
      policyId: 'POL-PEDAGOGY-DEFAULT',
      name: 'Standard Pedagogy & Anti-Dependency Policy',
      scope: 'PLATFORM_DEFAULT',
      rules: {
        maxHintsPerQuestion: 3,
        delayAnswerSeconds: 5,
        requireReflectionOnIncorrect: true,
        confidencePromptFrequency: 3, // every 3 items
        adaptiveDifficultyStep: 0.05,
        allowDirectAnswerGiving: false,
      },
      safetyFloorEnforced: true,
      version: '1.0.0',
      status: 'ACTIVE',
      updatedAt: '2026-09-01T00:00:00Z',
    };

    this.policies.set(defaultPolicy.policyId, defaultPolicy);
  }

  // --- RESEARCH STUDIES API ---

  getStudies(): ResearchStudyRecord[] {
    return Array.from(this.studies.values());
  }

  getStudyById(studyId: string): ResearchStudyRecord | undefined {
    return this.studies.get(studyId);
  }

  getStudiesByTrack(trackId: ResearchTrackId): ResearchStudyRecord[] {
    return Array.from(this.studies.values()).filter((s) => s.trackId === trackId);
  }

  registerStudy(study: Omit<ResearchStudyRecord, 'createdAt' | 'updatedAt'>): ResearchStudyRecord {
    if (this.studies.has(study.studyId)) {
      throw new BadRequestException(`Study with ID ${study.studyId} already exists`);
    }

    const now = new Date().toISOString();
    const record: ResearchStudyRecord = {
      ...study,
      createdAt: now,
      updatedAt: now,
    };

    // Calculate cryptographic reproducibility hash if not provided
    if (!record.reproducibilityPackageHash) {
      const hashPayload = `${study.studyId}:${study.hypothesis}:${study.sampleSize}:${study.methodology}`;
      record.reproducibilityPackageHash = `sha256:${crypto.createHash('sha256').update(hashPayload).digest('hex')}`;
    }

    this.studies.set(record.studyId, record);
    this.logger.log(`[RESEARCH] Registered study ${record.studyId} under track ${record.trackId}`);
    return record;
  }

  // --- EVIDENCE GAP REGISTRY ---

  getEvidenceGaps(): EvidenceGapRecord[] {
    return Array.from(this.evidenceGaps.values());
  }

  reportEvidenceGap(gap: Omit<EvidenceGapRecord, 'gapId' | 'identifiedAt'>): EvidenceGapRecord {
    const gapId = `GAP-${Date.now().toString(36).toUpperCase()}`;
    const record: EvidenceGapRecord = {
      gapId,
      ...gap,
      identifiedAt: new Date().toISOString(),
    };

    this.evidenceGaps.set(gapId, record);
    this.logger.warn(`[EVIDENCE-GAP] Registered gap ${gapId} in ${gap.domain} (Severity: ${gap.severity})`);
    return record;
  }

  assignStudyToGap(gapId: string, studyId: string): EvidenceGapRecord {
    const gap = this.evidenceGaps.get(gapId);
    if (!gap) throw new NotFoundException(`Gap ${gapId} not found`);
    if (!this.studies.has(studyId)) throw new NotFoundException(`Study ${studyId} not found`);

    gap.assignedStudyId = studyId;
    gap.status = 'STUDY_ASSIGNED';
    return gap;
  }

  resolveGap(gapId: string): EvidenceGapRecord {
    const gap = this.evidenceGaps.get(gapId);
    if (!gap) throw new NotFoundException(`Gap ${gapId} not found`);

    gap.status = 'RESOLVED';
    gap.resolvedAt = new Date().toISOString();
    return gap;
  }

  // --- PERSONALIZATION MODEL COMPETITION & PROMOTION ---

  getModels(): LearningModelRecord[] {
    return Array.from(this.models.values());
  }

  getModelById(modelId: string): LearningModelRecord | undefined {
    return this.models.get(modelId);
  }

  registerModel(model: Omit<LearningModelRecord, 'createdAt' | 'updatedAt'>): LearningModelRecord {
    if (this.models.has(model.modelId)) {
      throw new BadRequestException(`Model with ID ${model.modelId} already exists`);
    }

    const now = new Date().toISOString();
    const record: LearningModelRecord = {
      ...model,
      createdAt: now,
      updatedAt: now,
    };

    this.models.set(record.modelId, record);
    this.logger.log(`[MODEL-REGISTRY] Registered model ${record.modelId} (${record.algorithmFamily}) at stage ${record.promotionStage}`);
    return record;
  }

  /**
   * 8-Stage Model Promotion Pipeline (Clause N17.14)
   * RESEARCH -> OFFLINE_EVAL -> SHADOW -> CONTROLLED_PILOT -> INDEPENDENT_REVIEW -> APPROVED -> LIMITED_PROD -> GA
   */
  promoteModel(
    modelId: string,
    targetStage: ModelPromotionStage,
    reviewer: string,
    safetyReviewId?: string,
  ): LearningModelRecord {
    const model = this.models.get(modelId);
    if (!model) throw new NotFoundException(`Model ${modelId} not found`);

    const stageOrder: ModelPromotionStage[] = [
      'RESEARCH',
      'OFFLINE_EVAL',
      'SHADOW',
      'CONTROLLED_PILOT',
      'INDEPENDENT_REVIEW',
      'APPROVED',
      'LIMITED_PROD',
      'GA',
    ];

    const currentIndex = stageOrder.indexOf(model.promotionStage);
    const targetIndex = stageOrder.indexOf(targetStage);

    if (targetStage === 'RETIRED') {
      model.promotionStage = 'RETIRED';
      model.status = 'RETIRED';
      model.updatedAt = new Date().toISOString();
      return model;
    }

    if (targetIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Invalid promotion transition from ${model.promotionStage} to ${targetStage}. Must follow sequential pipeline.`,
      );
    }

    // Safety Gate: Promotion beyond CONTROLLED_PILOT requires explicit Safety Review ID
    if (targetIndex >= stageOrder.indexOf('INDEPENDENT_REVIEW') && !safetyReviewId && !model.safetyReviewId) {
      throw new BadRequestException(
        `Cannot promote model to ${targetStage} without independent Safety Review ID (Clause N17.14).`,
      );
    }

    // Accuracy Gate: To advance beyond SHADOW, AUC-ROC must exceed baseline (> 0.75)
    if (targetIndex >= stageOrder.indexOf('CONTROLLED_PILOT') && model.aucRoc < 0.75) {
      throw new BadRequestException(
        `Model AUC-ROC (${model.aucRoc}) does not meet minimum threshold (0.75) for ${targetStage}.`,
      );
    }

    model.promotionStage = targetStage;
    if (targetStage === 'APPROVED' || targetStage === 'LIMITED_PROD' || targetStage === 'GA') {
      model.status = 'APPROVED';
    } else if (targetStage === 'SHADOW') {
      model.status = 'SHADOW';
    } else {
      model.status = 'EXPERIMENTAL';
    }

    model.approvedBy = reviewer;
    if (safetyReviewId) model.safetyReviewId = safetyReviewId;
    model.updatedAt = new Date().toISOString();

    this.logger.log(`[MODEL-PROMOTION] Model ${modelId} successfully promoted to stage ${targetStage} by ${reviewer}`);
    return model;
  }

  /**
   * Safe Model Retirement without losing historical learner data (Clause N17.15).
   */
  retireModel(modelId: string, replacementModelId: string, reason: string): {
    retiredModelId: string;
    replacementModelId: string;
    reason: string;
    historicalLearnerDataPreserved: boolean;
    retiredAt: string;
  } {
    const model = this.models.get(modelId);
    if (!model) throw new NotFoundException(`Model ${modelId} not found`);
    if (!this.models.has(replacementModelId)) {
      throw new BadRequestException(`Replacement model ${replacementModelId} does not exist`);
    }

    model.promotionStage = 'RETIRED';
    model.status = 'RETIRED';
    model.updatedAt = new Date().toISOString();

    this.logger.warn(
      `[MODEL-RETIREMENT] Model ${modelId} retired. Replaced by ${replacementModelId}. Reason: ${reason}. Learner history preserved.`,
    );

    return {
      retiredModelId: modelId,
      replacementModelId,
      reason,
      historicalLearnerDataPreserved: true,
      retiredAt: new Date().toISOString(),
    };
  }

  // --- LEARNING POLICY REGISTRY ---

  getPolicies(): LearningPolicyRecord[] {
    return Array.from(this.policies.values());
  }

  registerPolicy(policy: Omit<LearningPolicyRecord, 'updatedAt'>): LearningPolicyRecord {
    const record: LearningPolicyRecord = {
      ...policy,
      updatedAt: new Date().toISOString(),
    };
    this.policies.set(policy.policyId, record);
    return record;
  }

  /**
   * Resolves conflicts between policies.
   * Invariant: Platform Safety Floor cannot be relaxed by institution or teacher policies (Clause N17.104–N17.105).
   */
  resolvePolicyConflict(
    basePolicyId: string,
    overridePolicy: Partial<LearningPolicyRecord['rules']>,
  ): LearningPolicyRecord['rules'] {
    const base = this.policies.get(basePolicyId);
    if (!base) throw new NotFoundException(`Base policy ${basePolicyId} not found`);

    const merged = { ...base.rules, ...overridePolicy };

    // Enforce platform safety floors:
    // 1. Direct answer giving can NEVER be allowed by overrides if base disallows
    if (!base.rules.allowDirectAnswerGiving && overridePolicy.allowDirectAnswerGiving === true) {
      merged.allowDirectAnswerGiving = false;
      this.logger.warn(`[POLICY-CONFLICT] Blocked override attempting to enable direct answer giving. Safety floor maintained.`);
    }

    // 2. Minimum reflection on incorrect cannot be removed
    if (base.rules.requireReflectionOnIncorrect && overridePolicy.requireReflectionOnIncorrect === false) {
      merged.requireReflectionOnIncorrect = true;
      this.logger.warn(`[POLICY-CONFLICT] Blocked override attempting to disable mandatory reflection. Safety floor maintained.`);
    }

    return merged;
  }
}
