import { Injectable, Logger } from '@nestjs/common';
import {
  AiTutorBenchmarkRecord,
  AntiDependencyMetric,
  MetacognitiveCalibrationRecord,
  CalibrationBias,
  TeacherCollaborationMetrics,
  ScaffoldingMode,
  DependencyRiskLevel,
} from './n17-types';

@Injectable()
export class AiTutorBenchmarkService {
  private readonly logger = new Logger(AiTutorBenchmarkService.name);

  // In-memory benchmarks catalog
  private readonly benchmarks = new Map<string, AiTutorBenchmarkRecord>();

  // In-memory anti-dependency records by learnerId
  private readonly antiDependencyMetrics = new Map<string, AntiDependencyMetric>();

  // In-memory metacognitive calibration records: key = `${learnerId}:${conceptId}`
  private readonly calibrationRecords = new Map<string, MetacognitiveCalibrationRecord>();

  // In-memory teacher collaboration tracking: key = `${teacherId}:${classId}`
  private readonly teacherMetrics = new Map<string, TeacherCollaborationMetrics>();

  constructor() {
    this.seedDefaultBenchmarks();
  }

  private seedDefaultBenchmarks(): void {
    const defaultBenchmarks: AiTutorBenchmarkRecord[] = [
      {
        benchmarkId: 'BM-2026-Q3-TUTOR-GEMMA',
        modelId: 'MODEL-GEMMA-9B-TUTOR',
        version: '1.4.0',
        pedagogyScore: 88,
        ageAppropriatenessScore: 92,
        clarityScore: 90,
        hallucinationRate: 0.003, // 0.3%
        safetyComplianceScore: 98,
        instructionFollowingScore: 94,
        personalizationScore: 86,
        studentUsefulnessScore: 89,
        teacherUsefulnessScore: 91,
        compositeBenchmarkScore: 89.8,
        certifiedPass: true,
        evaluatedAt: '2026-09-01T00:00:00Z',
      },
      {
        benchmarkId: 'BM-2026-Q3-TUTOR-EXPERIMENTAL',
        modelId: 'MODEL-EXPERIMENTAL-LLM',
        version: '0.9.1',
        pedagogyScore: 72,
        ageAppropriatenessScore: 78,
        clarityScore: 82,
        hallucinationRate: 0.025, // 2.5% - fails < 1% threshold
        safetyComplianceScore: 91,
        instructionFollowingScore: 76,
        personalizationScore: 80,
        studentUsefulnessScore: 75,
        teacherUsefulnessScore: 70,
        compositeBenchmarkScore: 76.4,
        certifiedPass: false,
        evaluatedAt: '2026-08-28T00:00:00Z',
      },
    ];

    for (const bm of defaultBenchmarks) {
      this.benchmarks.set(bm.benchmarkId, bm);
    }
  }

  // --- BENCHMARK API ---

  getBenchmarks(): AiTutorBenchmarkRecord[] {
    return Array.from(this.benchmarks.values());
  }

  recordBenchmark(
    data: Omit<AiTutorBenchmarkRecord, 'benchmarkId' | 'compositeBenchmarkScore' | 'certifiedPass' | 'evaluatedAt'>,
  ): AiTutorBenchmarkRecord {
    const benchmarkId = `BM-${Date.now().toString(36).toUpperCase()}`;

    // Calculate composite weighted benchmark (0-100)
    const composite =
      data.pedagogyScore * 0.20 +
      data.ageAppropriatenessScore * 0.15 +
      data.clarityScore * 0.15 +
      (1 - Math.min(1, data.hallucinationRate * 10)) * 100 * 0.15 +
      data.safetyComplianceScore * 0.15 +
      data.personalizationScore * 0.10 +
      data.teacherUsefulnessScore * 0.10;

    // Strict Certification criteria: Composite >= 80, Hallucination <= 0.01, Safety >= 95
    const certified =
      composite >= 80 &&
      data.hallucinationRate <= 0.01 &&
      data.safetyComplianceScore >= 95;

    const record: AiTutorBenchmarkRecord = {
      benchmarkId,
      ...data,
      compositeBenchmarkScore: Number(composite.toFixed(1)),
      certifiedPass: certified,
      evaluatedAt: new Date().toISOString(),
    };

    this.benchmarks.set(benchmarkId, record);
    this.logger.log(`[TUTOR-BENCHMARK] Evaluated ${data.modelId}: Composite=${record.compositeBenchmarkScore}, Pass=${certified}`);
    return record;
  }

  // --- ANTI-DEPENDENCY & OVERRELIANCE ENGINE (Clauses N17.28–N17.29) ---

  getAntiDependencyMetric(learnerId: string): AntiDependencyMetric {
    let metric = this.antiDependencyMetrics.get(learnerId);
    if (!metric) {
      metric = {
        learnerId,
        totalSessionCount: 1,
        answerSeekingIndex: 0.15,
        independentReasoningRatio: 0.85,
        hintProgressionLevel: 1,
        scaffoldingMode: 'NORMAL',
        dependencyRisk: 'LOW',
        consecutiveDirectHelpRequests: 0,
        transferWithoutAiScore: 82,
        lastInterventionAt: new Date().toISOString(),
      };
      this.antiDependencyMetrics.set(learnerId, metric);
    }
    return metric;
  }

  /**
   * Evaluates tutor interactions for dependency signals and updates scaffolding mode.
   */
  recordTutorInteraction(
    learnerId: string,
    isDirectHelpRequest: boolean,
    selfAttemptedFirst: boolean,
    transferWithoutAiScore?: number,
  ): AntiDependencyMetric {
    const metric = this.getAntiDependencyMetric(learnerId);
    metric.totalSessionCount += 1;

    if (transferWithoutAiScore !== undefined) {
      metric.transferWithoutAiScore = transferWithoutAiScore;
    }

    if (isDirectHelpRequest) {
      metric.consecutiveDirectHelpRequests += 1;
      metric.answerSeekingIndex = Number(Math.min(1.0, metric.answerSeekingIndex + 0.05).toFixed(2));
    } else {
      metric.consecutiveDirectHelpRequests = Math.max(0, metric.consecutiveDirectHelpRequests - 1);
      metric.answerSeekingIndex = Number(Math.max(0.0, metric.answerSeekingIndex - 0.03).toFixed(2));
    }

    if (selfAttemptedFirst) {
      metric.independentReasoningRatio = Number(Math.min(1.0, metric.independentReasoningRatio + 0.04).toFixed(2));
    } else {
      metric.independentReasoningRatio = Number(Math.max(0.0, metric.independentReasoningRatio - 0.05).toFixed(2));
    }

    // Adaptive Scaffolding State Machine:
    // Normal -> Progressive Hint -> Delayed Answer -> Reflection Mandatory -> Independent Attempt Required
    let nextMode: ScaffoldingMode = 'NORMAL';
    let risk: DependencyRiskLevel = 'LOW';

    if (metric.consecutiveDirectHelpRequests >= 4 || metric.answerSeekingIndex > 0.70) {
      nextMode = 'INDEPENDENT_ATTEMPT_REQUIRED';
      risk = 'HIGH';
    } else if (metric.consecutiveDirectHelpRequests >= 3 || metric.answerSeekingIndex > 0.55) {
      nextMode = 'REFLECTION_MANDATORY';
      risk = 'ELEVATED';
    } else if (metric.consecutiveDirectHelpRequests >= 2 || metric.answerSeekingIndex > 0.40) {
      nextMode = 'DELAYED_ANSWER';
      risk = 'MODERATE';
    } else if (metric.answerSeekingIndex > 0.25) {
      nextMode = 'PROGRESSIVE_HINT';
      risk = 'LOW';
    }

    // If transfer score without AI is critically low (< 50) while using AI tutor frequently, escalate risk
    if (metric.transferWithoutAiScore < 50 && metric.totalSessionCount > 5) {
      risk = risk === 'LOW' ? 'MODERATE' : 'HIGH';
      if (nextMode === 'NORMAL') nextMode = 'PROGRESSIVE_HINT';
    }

    metric.scaffoldingMode = nextMode;
    metric.dependencyRisk = risk;
    metric.lastInterventionAt = new Date().toISOString();

    return metric;
  }

  // --- METACOGNITIVE CALIBRATION ENGINE (Clauses N17.30–N17.32) ---

  /**
   * Evaluates self-reported confidence vs actual performance.
   * Separates Mastery != Confidence.
   */
  evaluateCalibration(
    learnerId: string,
    conceptId: string,
    selfReportedConfidence: number,
    actualPerformanceScore: number,
  ): MetacognitiveCalibrationRecord {
    const calibrationError = selfReportedConfidence - actualPerformanceScore;

    let bias: CalibrationBias = 'ACCURATE';
    let strategy = 'Continue balanced self-monitoring and reflection.';

    if (calibrationError > 20) {
      bias = 'OVERCONFIDENT';
      strategy =
        'Learner exhibits unconscious errors. Introduce counter-example challenges and explicit verification checklists before submission.';
    } else if (calibrationError < -20) {
      bias = 'UNDERCONFIDENT';
      strategy =
        'Learner possesses mastery but doubts ability. Provide positive self-efficacy and calibration reinforcement to celebrate independent correct reasoning.';
    }

    const record: MetacognitiveCalibrationRecord = {
      learnerId,
      conceptId,
      selfReportedConfidence,
      actualPerformanceScore,
      calibrationError,
      calibrationBias: bias,
      recommendedReflectionStrategy: strategy,
      evaluatedAt: new Date().toISOString(),
    };

    this.calibrationRecords.set(`${learnerId}:${conceptId}`, record);
    this.logger.log(
      `[CALIBRATION] Learner ${learnerId} on ${conceptId}: Conf=${selfReportedConfidence}, Perf=${actualPerformanceScore}, Bias=${bias}`,
    );

    return record;
  }

  getCalibrationRecord(learnerId: string, conceptId: string): MetacognitiveCalibrationRecord | undefined {
    return this.calibrationRecords.get(`${learnerId}:${conceptId}`);
  }

  // --- TEACHER COLLABORATION & WORKLOAD INTELLIGENCE (Clauses N17.38–N17.41) ---

  recordTeacherCollaboration(
    teacherId: string,
    classId: string,
    reviewedCount: number,
    acceptedCount: number,
    overriddenCount: number,
    overrideReason?: string,
  ): TeacherCollaborationMetrics {
    const key = `${teacherId}:${classId}`;
    let metrics = this.teacherMetrics.get(key);

    if (!metrics) {
      metrics = {
        teacherId,
        classId,
        weeklyAiRecommendationsReviewed: 0,
        recommendationsAccepted: 0,
        recommendationsOverridden: 0,
        acceptanceRate: 1.0,
        estimatedTeacherMinutesSaved: 0,
        overrideReasonsDistribution: {},
        collaborationScore: 85,
      };
      this.teacherMetrics.set(key, metrics);
    }

    metrics.weeklyAiRecommendationsReviewed += reviewedCount;
    metrics.recommendationsAccepted += acceptedCount;
    metrics.recommendationsOverridden += overriddenCount;

    const total = metrics.recommendationsAccepted + metrics.recommendationsOverridden;
    metrics.acceptanceRate = total > 0 ? Number((metrics.recommendationsAccepted / total).toFixed(2)) : 1.0;

    // Estimate ~3.5 minutes saved per accepted high-quality recommendation
    metrics.estimatedTeacherMinutesSaved += acceptedCount * 3.5;

    if (overrideReason) {
      metrics.overrideReasonsDistribution[overrideReason] =
        (metrics.overrideReasonsDistribution[overrideReason] || 0) + 1;
    }

    // Collaboration score: Healthy range is 65-90. 100% rubber-stamping or 0% acceptance suggests misalignment
    const balancedRate = Math.min(metrics.acceptanceRate, 1.0 - metrics.acceptanceRate);
    metrics.collaborationScore = Math.round(50 + balancedRate * 80);

    return metrics;
  }

  getTeacherMetrics(teacherId: string, classId: string): TeacherCollaborationMetrics | undefined {
    return this.teacherMetrics.get(`${teacherId}:${classId}`);
  }
}
