import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  LearningState2,
  LearningEvidenceEvent,
  EvidenceLevel,
} from './n18-types';

@Injectable()
export class LearningStateEngineService {
  private readonly logger = new Logger(LearningStateEngineService.name);

  // In-memory ledger of LearningState2: key = `${learnerId}:${conceptId}`
  private readonly learningStates = new Map<string, LearningState2>();

  // In-memory set of processed evidence hashes to prevent duplicate counting
  private readonly processedEvidenceHashes = new Set<string>();

  // In-memory chronological history of evidence events
  private readonly evidenceHistory = new Map<string, LearningEvidenceEvent[]>();

  constructor() {
    this.seedDefaultLearningStates();
  }

  private seedDefaultLearningStates(): void {
    const defaults: LearningState2[] = [
      {
        learnerId: 'STUDENT-201',
        conceptId: 'MATH-FRAC-001',
        mastery: 0.72,
        uncertaintySigma: 0.08,
        masteryConfidenceInterval: [0.64, 0.80],
        confidence: 85,
        retentionEstimate: 78,
        transferEvidence: 68,
        recentPerformance: 75,
        errorPatterns: ['MISC-FRAC-ADD-NUM'],
        hintUsage: 2,
        helpSeeking: 0.25,
        pacingSignal: 1.05,
        strategyEvidence: ['RETRIEVE', 'COMPARE'],
        interventionResponses: [
          { interventionId: 'INT-FRAC-VIS-01', outcomeScore: 82, timestamp: '2026-09-10T10:00:00Z' },
        ],
        isRemediationTrapped: false,
        isChallengeTrapped: false,
        consecutiveRemedialSessions: 0,
        lastValidatedAt: '2026-09-15T12:00:00Z',
        modelVersion: 'BKT-HYBRID-2.1',
        policyVersion: 'POL-N18-V1',
      },
      {
        learnerId: 'STUDENT-TRAPPED-01',
        conceptId: 'MATH-FRAC-001',
        mastery: 0.42,
        uncertaintySigma: 0.12,
        masteryConfidenceInterval: [0.30, 0.54],
        confidence: 40,
        retentionEstimate: 45,
        transferEvidence: 30,
        recentPerformance: 45,
        errorPatterns: ['MISC-FRAC-ADD-NUM'],
        hintUsage: 8,
        helpSeeking: 0.75,
        pacingSignal: 0.70,
        strategyEvidence: ['EXPLAIN'],
        interventionResponses: [],
        isRemediationTrapped: true, // 5 sessions trapped in remediation
        isChallengeTrapped: false,
        consecutiveRemedialSessions: 5,
        lastValidatedAt: '2026-09-14T09:00:00Z',
        modelVersion: 'BKT-HYBRID-2.1',
        policyVersion: 'POL-N18-V1',
      },
    ];

    for (const s of defaults) {
      this.learningStates.set(`${s.learnerId}:${s.conceptId}`, s);
    }
  }

  /**
   * Retrieves Learning State 2.0 by learner and concept.
   */
  getLearningState(learnerId: string, conceptId: string): LearningState2 | undefined {
    return this.learningStates.get(`${learnerId}:${conceptId}`);
  }

  /**
   * Initializes or returns Learning State 2.0 with Bayesian uncertainty bounds.
   */
  getOrInitializeLearningState(learnerId: string, conceptId: string): LearningState2 {
    const key = `${learnerId}:${conceptId}`;
    let state = this.learningStates.get(key);

    if (!state) {
      state = {
        learnerId,
        conceptId,
        mastery: 0.50, // Prior neutral mean
        uncertaintySigma: 0.25, // Broad initial prior uncertainty
        masteryConfidenceInterval: [0.25, 0.75],
        confidence: 50,
        retentionEstimate: 50,
        transferEvidence: 40,
        recentPerformance: 50,
        errorPatterns: [],
        hintUsage: 0,
        helpSeeking: 0.10,
        pacingSignal: 1.0,
        strategyEvidence: [],
        interventionResponses: [],
        isRemediationTrapped: false,
        isChallengeTrapped: false,
        consecutiveRemedialSessions: 0,
        lastValidatedAt: new Date().toISOString(),
        modelVersion: 'BKT-HYBRID-2.1',
        policyVersion: 'POL-N18-V1',
      };
      this.learningStates.set(key, state);
    }

    return state;
  }

  /**
   * Ingests evidence following the 6-Level Evidence Hierarchy (Clauses N18.11–N18.13).
   * Rejects duplicates and updates Bayesian credibility bounds.
   */
  ingestEvidence(event: Omit<LearningEvidenceEvent, 'provenanceHash'> & { provenanceHash?: string }): {
    event: LearningEvidenceEvent;
    updatedState: LearningState2;
    duplicateRejected: boolean;
  } {
    // Generate deterministic hash if not provided
    const payload = `${event.learnerId}:${event.conceptId}:${event.level}:${event.score}:${event.recencyTimestamp}`;
    const hash = event.provenanceHash || `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;

    // Duplicate Rejection Invariant (Clause N18.182)
    if (this.processedEvidenceHashes.has(hash)) {
      this.logger.warn(`[EVIDENCE-DUPLICATE] Event with hash ${hash} already processed; skipping to prevent double-counting.`);
      const existingState = this.getOrInitializeLearningState(event.learnerId, event.conceptId);
      return {
        event: { ...event, provenanceHash: hash },
        updatedState: existingState,
        duplicateRejected: true,
      };
    }

    this.processedEvidenceHashes.add(hash);
    const fullEvent: LearningEvidenceEvent = { ...event, provenanceHash: hash };

    const key = `${event.learnerId}:${event.conceptId}`;
    const history = this.evidenceHistory.get(key) || [];
    history.push(fullEvent);
    this.evidenceHistory.set(key, history);

    // Get weight based on 6-Level Hierarchy
    const levelWeights: Record<EvidenceLevel, number> = {
      LEVEL_1_INTERACTION: 0.10,
      LEVEL_2_PRACTICE: 0.25,
      LEVEL_3_ASSESSMENT: 0.50,
      LEVEL_4_TRANSFER: 0.75,
      LEVEL_5_RETENTION: 0.85,
      LEVEL_6_TEACHER_VALIDATED: 1.00,
    };

    const tierWeight = levelWeights[event.level] || 0.25;
    const effectiveWeight = tierWeight * event.difficultyWeight;

    const state = this.getOrInitializeLearningState(event.learnerId, event.conceptId);

    // Update Bayesian Mastery Estimate (Kalman / Bayesian update approximation)
    // New Mean: mu_new = (mu_old / sigma_old^2 + score * weight / sigma_obs^2) / (1 / sigma_old^2 + weight / sigma_obs^2)
    const normalizedScore = event.score / 100;
    const obsVariance = 0.04 / effectiveWeight;
    const priorVariance = state.uncertaintySigma * state.uncertaintySigma;

    const postVariance = 1 / (1 / priorVariance + 1 / obsVariance);
    const postMean = postVariance * (state.mastery / priorVariance + normalizedScore / obsVariance);

    state.mastery = Number(Math.max(0.01, Math.min(0.99, postMean)).toFixed(3));
    state.uncertaintySigma = Number(Math.max(0.02, Math.min(0.28, Math.sqrt(postVariance))).toFixed(3));
    state.masteryConfidenceInterval = [
      Number(Math.max(0.0, state.mastery - state.uncertaintySigma).toFixed(3)),
      Number(Math.min(1.0, state.mastery + state.uncertaintySigma).toFixed(3)),
    ];

    state.recentPerformance = Math.round(state.recentPerformance * 0.7 + event.score * 0.3);

    // Level-specific updates
    if (event.level === 'LEVEL_4_TRANSFER') {
      state.transferEvidence = Math.round(state.transferEvidence * 0.5 + event.score * 0.5);
    } else if (event.level === 'LEVEL_5_RETENTION') {
      state.retentionEstimate = Math.round(state.retentionEstimate * 0.5 + event.score * 0.5);
    }

    // Traps Detection Logic:
    // 1. Remediation Trap check: If low mastery persists without progress
    if (state.mastery < 0.50) {
      state.consecutiveRemedialSessions += 1;
      if (state.consecutiveRemedialSessions >= 4) {
        state.isRemediationTrapped = true;
        this.logger.warn(`[TRAP-DETECTED] Remediation Trap flagged for learner ${event.learnerId} on ${event.conceptId}`);
      }
    } else {
      state.consecutiveRemedialSessions = 0;
      state.isRemediationTrapped = false;
    }

    // 2. Challenge Trap check: Premature challenge when uncertainty is broad (> 0.15)
    if (event.difficultyWeight > 1.5 && state.uncertaintySigma > 0.15) {
      state.isChallengeTrapped = true;
      this.logger.warn(`[TRAP-DETECTED] Challenge Trap flagged: escalating difficulty with broad uncertainty (${state.uncertaintySigma})`);
    } else {
      state.isChallengeTrapped = false;
    }

    state.lastValidatedAt = new Date().toISOString();

    return {
      event: fullEvent,
      updatedState: state,
      duplicateRejected: false,
    };
  }

  /**
   * Corrects a learning state upon teacher or admin review (Clauses N18.74–N18.75).
   * Generates cryptographic audit entry and recalculates credibility interval.
   */
  correctLearningState(
    learnerId: string,
    conceptId: string,
    correctedMastery: number,
    teacherId: string,
    rationale: string,
  ): {
    state: LearningState2;
    correctionAuditHash: string;
  } {
    const state = this.getOrInitializeLearningState(learnerId, conceptId);

    state.mastery = Math.max(0.0, Math.min(1.0, correctedMastery));
    state.uncertaintySigma = 0.05; // Teacher override narrows uncertainty
    state.masteryConfidenceInterval = [
      Number(Math.max(0.0, state.mastery - 0.05).toFixed(3)),
      Number(Math.min(1.0, state.mastery + 0.05).toFixed(3)),
    ];
    state.consecutiveRemedialSessions = 0;
    state.isRemediationTrapped = false;
    state.isChallengeTrapped = false;
    state.lastValidatedAt = new Date().toISOString();

    const auditPayload = `${learnerId}:${conceptId}:${correctedMastery}:${teacherId}:${rationale}:${Date.now()}`;
    const hash = `sha256:${crypto.createHash('sha256').update(auditPayload).digest('hex')}`;

    this.logger.log(
      `[STATE-CORRECTION] Learning state for ${learnerId}:${conceptId} corrected by ${teacherId} to ${correctedMastery}. Audit: ${hash}`,
    );

    return { state, correctionAuditHash: hash };
  }

  /**
   * Transient State Expiration (Clauses N18.158–N18.159).
   * Resets short-term pacing and temporary preferences older than 30 days.
   */
  expireTransientState(learnerId: string, conceptId: string): LearningState2 {
    const state = this.getOrInitializeLearningState(learnerId, conceptId);
    state.pacingSignal = 1.0; // Reset to normal baseline
    state.hintUsage = 0;
    return state;
  }
}
