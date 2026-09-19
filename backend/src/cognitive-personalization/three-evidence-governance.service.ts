import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  TeacherLearningEvidence,
  EvidenceConflictRecord,
  LearningExperiment,
  SimplicityBenchmarkResult,
} from './n18-types';

@Injectable()
export class ThreeEvidenceGovernanceService {
  private readonly logger = new Logger(ThreeEvidenceGovernanceService.name);

  // In-memory teacher evidence ledger
  private readonly teacherEvidenceLedger = new Map<string, TeacherLearningEvidence>();

  // In-memory evidence conflicts: key = conflictId
  private readonly conflictLedger = new Map<string, EvidenceConflictRecord>();

  // In-memory learning experiments: key = experimentId
  private readonly experimentRegistry = new Map<string, LearningExperiment>();

  constructor() {
    this.seedDefaultEvidenceAndExperiments();
  }

  private seedDefaultEvidenceAndExperiments(): void {
    const defaultTeacherEvidence: TeacherLearningEvidence = {
      evidenceId: 'TEV-2026-001',
      learnerId: 'STUDENT-201',
      conceptId: 'MATH-FRAC-001',
      observation: 'Student clearly demonstrated fraction simplification using physical folding strips in class.',
      evidenceType: 'CLASSROOM_PERFORMANCE',
      confidence: 0.90,
      teacherId: 'TEACHER-RAO',
      tenantId: 'TENANT-DPS-DELHI',
      audited: true,
      createdAt: '2026-09-14T11:00:00Z',
    };
    this.teacherEvidenceLedger.set(defaultTeacherEvidence.evidenceId, defaultTeacherEvidence);

    const defaultConflict: EvidenceConflictRecord = {
      conflictId: 'CONF-2026-FRAC-01',
      learnerId: 'STUDENT-201',
      conceptId: 'MATH-FRAC-001',
      systemEstimate: 45, // System estimated 45% based on quick quiz
      teacherEstimate: 85, // Teacher observed 85% in classroom demonstration
      learnerSelfRating: 80,
      divergenceDelta: 40, // |45 - 85| = 40 (high conflict)
      resolutionStatus: 'PENDING_DIAGNOSTIC',
      diagnosticTaskId: 'ACT-DIAG-RECONCILE-FRAC-01',
    };
    this.conflictLedger.set(defaultConflict.conflictId, defaultConflict);

    const defaultExperiment: LearningExperiment = {
      experimentId: 'EXP-N18-SPACING-01',
      hypothesis: 'Personalized Leitner intervals based on decay rates outperform static 3-day reviews by >15% on 30d retention',
      populationDefinition: 'Grade 5 Mathematics Cohort (N=1,500)',
      intervention: 'Dynamic Half-Life Spaced Retrieval Scheduler',
      comparator: 'Uniform 3-Day Review Schedule',
      primaryMetric: '30d_uncued_retention_score',
      secondaryMetrics: ['completion_rate', 'frustration_index'],
      safetyMetrics: ['error_spike_rate'],
      stopConditions: ['error_spike_gt_15%', 'drop_out_gt_10%'],
      status: 'SANDBOX_ACTIVE',
      createdAt: '2026-08-20T00:00:00Z',
    };
    this.experimentRegistry.set(defaultExperiment.experimentId, defaultExperiment);
  }

  // --- TEACHER EVIDENCE CONTRACT (Clauses N18.61–N18.63) ---

  recordTeacherEvidence(
    evidence: Omit<TeacherLearningEvidence, 'evidenceId' | 'audited' | 'createdAt'>,
  ): TeacherLearningEvidence {
    const evidenceId = `TEV-${Date.now().toString(36).toUpperCase()}`;

    const record: TeacherLearningEvidence = {
      evidenceId,
      ...evidence,
      audited: true,
      createdAt: new Date().toISOString(),
    };

    this.teacherEvidenceLedger.set(evidenceId, record);
    this.logger.log(
      `[TEACHER-EVIDENCE] Recorded observation by ${evidence.teacherId} for ${evidence.learnerId} on ${evidence.conceptId}`,
    );
    return record;
  }

  getTeacherEvidence(learnerId: string, conceptId?: string): TeacherLearningEvidence[] {
    return Array.from(this.teacherEvidenceLedger.values()).filter(
      (e) => e.learnerId === learnerId && (!conceptId || e.conceptId === conceptId),
    );
  }

  // --- EVIDENCE CONFLICT RESOLUTION ENGINE (Clauses N18.67–N18.68) ---

  /**
   * Detects and records divergence between System, Teacher, and Learner estimates.
   * If divergence > 25 points, enters PENDING_DIAGNOSTIC and generates diagnostic micro-task.
   */
  evaluateEvidenceConflict(
    learnerId: string,
    conceptId: string,
    systemEstimate: number,
    teacherEstimate: number,
    learnerSelfRating: number,
  ): EvidenceConflictRecord {
    const divergenceDelta = Math.abs(systemEstimate - teacherEstimate);
    const conflictId = `CONF-${Date.now().toString(36).toUpperCase()}`;

    let status: EvidenceConflictRecord['resolutionStatus'] = 'RESOLVED_RECONCILED';
    let diagnosticTask: string | undefined = undefined;

    if (divergenceDelta > 25) {
      status = 'PENDING_DIAGNOSTIC';
      diagnosticTask = `ACT-DIAG-RECONCILE-${conceptId}`;
      this.logger.warn(
        `[EVIDENCE-CONFLICT] Divergence delta ${divergenceDelta} between System (${systemEstimate}) and Teacher (${teacherEstimate}) on ${conceptId}. Scheduling diagnostic micro-task.`,
      );
    }

    const record: EvidenceConflictRecord = {
      conflictId,
      learnerId,
      conceptId,
      systemEstimate,
      teacherEstimate,
      learnerSelfRating,
      divergenceDelta,
      resolutionStatus: status,
      diagnosticTaskId: diagnosticTask,
      resolvedAt: status === 'RESOLVED_RECONCILED' ? new Date().toISOString() : undefined,
    };

    this.conflictLedger.set(conflictId, record);
    return record;
  }

  resolveConflictWithDiagnostic(
    conflictId: string,
    diagnosticScore: number,
    resolutionRationale: string,
  ): EvidenceConflictRecord {
    const conflict = this.conflictLedger.get(conflictId);
    if (!conflict) throw new NotFoundException(`Conflict ${conflictId} not found`);

    conflict.resolutionStatus = 'RESOLVED_RECONCILED';
    conflict.resolutionRationale = `${resolutionRationale} (Diagnostic Score: ${diagnosticScore}%)`;
    conflict.resolvedAt = new Date().toISOString();

    this.logger.log(`[CONFLICT-RESOLVED] Conflict ${conflictId} resolved with diagnostic score ${diagnosticScore}%`);
    return conflict;
  }

  getConflicts(): EvidenceConflictRecord[] {
    return Array.from(this.conflictLedger.values());
  }

  // --- GOVERNED LEARNING EXPERIMENT REGISTRY (Clauses N18.23–N18.26) ---

  getExperiments(): LearningExperiment[] {
    return Array.from(this.experimentRegistry.values());
  }

  registerExperiment(
    experiment: Omit<LearningExperiment, 'experimentId' | 'createdAt'>,
  ): LearningExperiment {
    // Primary outcome rule (Clause N18.25): Must declare primary outcome upfront
    if (!experiment.primaryMetric || experiment.primaryMetric.trim() === '') {
      throw new BadRequestException('Learning experiments must declare a primary outcome metric upfront.');
    }

    if (!experiment.stopConditions || experiment.stopConditions.length === 0) {
      throw new BadRequestException('Learning experiments must declare automated stop conditions for safety.');
    }

    const experimentId = `EXP-${Date.now().toString(36).toUpperCase()}`;
    const record: LearningExperiment = {
      experimentId,
      ...experiment,
      createdAt: new Date().toISOString(),
    };

    this.experimentRegistry.set(experimentId, record);
    this.logger.log(`[EXPERIMENT-REGISTERED] Experiment ${experimentId}: ${experiment.hypothesis}`);
    return record;
  }

  // --- SIMPLICITY BENCHMARK (Clauses N18.136–N18.137) ---

  /**
   * Compares complex AI model against simple deterministic baseline.
   * Complex model MUST beat simple baseline by at least 5% (delta >= 0.05) to be authorized for production.
   */
  evaluateSimplicityBenchmark(
    modelId: string,
    simpleBaselineScore: number,
    complexModelScore: number,
  ): SimplicityBenchmarkResult {
    const delta = Number((complexModelScore - simpleBaselineScore).toFixed(3));
    const exceeds = delta >= 0.05;

    const result: SimplicityBenchmarkResult = {
      modelId,
      simpleBaselineScore,
      complexModelScore,
      deltaAdvantage: delta,
      exceedsThreshold: exceeds,
      authorizedForProduction: exceeds,
    };

    if (!exceeds) {
      this.logger.warn(
        `[SIMPLICITY-BENCHMARK-FAIL] Model ${modelId} delta (${delta}) failed 5% threshold over baseline. Rejected for production.`,
      );
    } else {
      this.logger.log(`[SIMPLICITY-BENCHMARK-PASS] Model ${modelId} outperformed baseline by ${(delta * 100).toFixed(1)}%. Authorized.`);
    }

    return result;
  }

  // --- COGNITIVE PERSONALIZATION SAFETY GUARDRAILS (Clauses N18.2, N18.71) ---

  /**
   * Validates personalization inputs to prevent psychological profiling, medical diagnosis, or sensitive attribute misuse.
   */
  validatePersonalizationSafety(input: {
    inferredAttributes?: string[];
    sensitiveDemographicsUsed?: boolean;
  }): {
    safe: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const prohibited = ['personality', 'depression', 'anxiety', 'iq', 'future_life_success', 'mental_health'];

    if (input.inferredAttributes) {
      for (const attr of input.inferredAttributes) {
        if (prohibited.some((p) => attr.toLowerCase().includes(p))) {
          violations.push(`Prohibited psychological profiling attribute: ${attr}`);
        }
      }
    }

    if (input.sensitiveDemographicsUsed) {
      violations.push('Prohibited use of sensitive demographic attributes for algorithmic personalization.');
    }

    return {
      safe: violations.length === 0,
      violations,
    };
  }
}
