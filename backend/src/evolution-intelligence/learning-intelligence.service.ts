import { Injectable, Logger } from '@nestjs/common';
import {
  RetentionTransferRecord,
  ExplainablePersonalizationRationale,
  TransferDistance,
} from './n17-types';

export interface ConceptDifficultyCluster {
  conceptId: string;
  conceptName: string;
  subject: string;
  difficultyIndex: number;         // 0.00 (trivial) to 1.00 (extremely difficult)
  totalLearnersEvaluated: number;
  averageAttemptsToMaster: number;
  topRecurringMisconceptions: {
    misconceptionId: string;
    description: string;
    recurrenceRate: number;        // 0.00 to 1.00
    effectiveInterventionStrategy: string;
  }[];
  prerequisiteBottleneckScore: number; // impact on downstream concepts
}

export interface LongitudinalMasteryPoint {
  timestamp: string;
  score: number;
  type: 'IMMEDIATE_RECALL' | 'SPACED_RETRIEVAL' | 'NEAR_TRANSFER' | 'FAR_TRANSFER';
  scaffoldingUsed: boolean;
}

@Injectable()
export class LearningIntelligenceService {
  private readonly logger = new Logger(LearningIntelligenceService.name);

  // In-memory registry of concept difficulty clusters
  private readonly conceptClusters = new Map<string, ConceptDifficultyCluster>();

  // In-memory storage for retention and transfer records: key = `${learnerId}:${conceptId}`
  private readonly retentionTransferLedger = new Map<string, RetentionTransferRecord>();

  // In-memory storage for longitudinal trajectories: key = `${learnerId}:${conceptId}`
  private readonly trajectoryStore = new Map<string, LongitudinalMasteryPoint[]>();

  constructor() {
    this.seedDefaultClusters();
  }

  private seedDefaultClusters(): void {
    const defaultClusters: ConceptDifficultyCluster[] = [
      {
        conceptId: 'MATH-FRAC-001',
        conceptName: 'Equivalent Fractions & Simplification',
        subject: 'Mathematics',
        difficultyIndex: 0.68,
        totalLearnersEvaluated: 1420,
        averageAttemptsToMaster: 3.8,
        topRecurringMisconceptions: [
          {
            misconceptionId: 'MISC-FRAC-ADD-NUM',
            description: 'Adding numerators and denominators directly (a/b + c/d = (a+c)/(b+d))',
            recurrenceRate: 0.42,
            effectiveInterventionStrategy: 'Visual fraction strips and area bar representations',
          },
          {
            misconceptionId: 'MISC-FRAC-INV-SIZE',
            description: 'Believing larger denominator implies larger fraction value',
            recurrenceRate: 0.35,
            effectiveInterventionStrategy: 'Inverse proportionality physical simulation',
          },
        ],
        prerequisiteBottleneckScore: 0.85,
      },
      {
        conceptId: 'SCI-PHYS-002',
        conceptName: 'Newtonian Force & Inertia',
        subject: 'Physics',
        difficultyIndex: 0.74,
        totalLearnersEvaluated: 1150,
        averageAttemptsToMaster: 4.2,
        topRecurringMisconceptions: [
          {
            misconceptionId: 'MISC-FORCE-MOTION',
            description: 'Believing sustained velocity requires constant net forward force',
            recurrenceRate: 0.58,
            effectiveInterventionStrategy: 'Zero-friction puck simulation with vector overlay',
          },
        ],
        prerequisiteBottleneckScore: 0.92,
      },
      {
        conceptId: 'CS-ALGO-003',
        conceptName: 'Recursive Base Cases & Call Stack',
        subject: 'Computer Science',
        difficultyIndex: 0.79,
        totalLearnersEvaluated: 890,
        averageAttemptsToMaster: 4.6,
        topRecurringMisconceptions: [
          {
            misconceptionId: 'MISC-REC-INFINITE',
            description: 'Omitting base condition check or mutating global parameter',
            recurrenceRate: 0.49,
            effectiveInterventionStrategy: 'Interactive call-stack visualizer and step-through debugger',
          },
        ],
        prerequisiteBottleneckScore: 0.88,
      },
    ];

    for (const cluster of defaultClusters) {
      this.conceptClusters.set(cluster.conceptId, cluster);
    }
  }

  /**
   * Retrieves all concept difficulty clusters.
   */
  getConceptDifficultyClusters(): ConceptDifficultyCluster[] {
    return Array.from(this.conceptClusters.values());
  }

  /**
   * Retrieves a specific concept difficulty cluster by concept ID.
   */
  getConceptCluster(conceptId: string): ConceptDifficultyCluster | undefined {
    return this.conceptClusters.get(conceptId);
  }

  /**
   * Records empirical interaction data to update difficulty and misconception indices.
   */
  recordConceptInteraction(
    conceptId: string,
    success: boolean,
    misconceptionId?: string,
  ): ConceptDifficultyCluster {
    let cluster = this.conceptClusters.get(conceptId);
    if (!cluster) {
      cluster = {
        conceptId,
        conceptName: `Concept ${conceptId}`,
        subject: 'General',
        difficultyIndex: success ? 0.3 : 0.7,
        totalLearnersEvaluated: 1,
        averageAttemptsToMaster: success ? 1 : 2,
        topRecurringMisconceptions: [],
        prerequisiteBottleneckScore: 0.5,
      };
      this.conceptClusters.set(conceptId, cluster);
    } else {
      cluster.totalLearnersEvaluated += 1;
      const weight = 1 / Math.min(cluster.totalLearnersEvaluated, 100);
      const instantDiff = success ? 0.0 : 1.0;
      cluster.difficultyIndex = Number((cluster.difficultyIndex * (1 - weight) + instantDiff * weight).toFixed(3));
    }

    if (misconceptionId) {
      const existing = cluster.topRecurringMisconceptions.find((m) => m.misconceptionId === misconceptionId);
      if (existing) {
        existing.recurrenceRate = Number(Math.min(1.0, existing.recurrenceRate + 0.02).toFixed(3));
      } else {
        cluster.topRecurringMisconceptions.push({
          misconceptionId,
          description: `Observed misconception ${misconceptionId}`,
          recurrenceRate: 0.1,
          effectiveInterventionStrategy: 'Targeted Socratic reflection prompt',
        });
      }
    }

    return cluster;
  }

  /**
   * Evaluates retention and transfer for a learner on a concept.
   * Enforces the Invariant: Immediate Recall != Long-Term Retention != Transfer Mastery.
   */
  evaluateRetentionAndTransfer(
    learnerId: string,
    conceptId: string,
    immediateRecallScore: number,
    retentionIntervalDays: number,
    retainedScore: number,
    nearTransferScore: number,
    mediumTransferScore: number,
    farTransferScore: number,
  ): RetentionTransferRecord {
    // Calculate retention decay rate (exponential decay approximation: Score(t) = Score(0) * e^(-lambda * t))
    let decayRate = 0.05;
    if (retentionIntervalDays > 0 && immediateRecallScore > 0) {
      const ratio = Math.max(0.01, retainedScore / immediateRecallScore);
      decayRate = Number(((-Math.log(ratio)) / retentionIntervalDays).toFixed(4));
    }

    // Transfer mastery requires robust performance across all 3 transfer tiers:
    // Near >= 80, Medium >= 70, Far >= 60
    const overallTransferMastery =
      nearTransferScore >= 80 &&
      mediumTransferScore >= 70 &&
      farTransferScore >= 60;

    const record: RetentionTransferRecord = {
      learnerId,
      conceptId,
      immediateRecallScore,
      retentionIntervalDays,
      retainedScore,
      retentionDecayRate: Math.max(0, decayRate),
      nearTransferScore,
      mediumTransferScore,
      farTransferScore,
      overallTransferMastery,
      evaluatedAt: new Date().toISOString(),
    };

    const key = `${learnerId}:${conceptId}`;
    this.retentionTransferLedger.set(key, record);

    // Append to longitudinal trajectory
    const trajectory = this.trajectoryStore.get(key) || [];
    trajectory.push(
      {
        timestamp: new Date().toISOString(),
        score: immediateRecallScore,
        type: 'IMMEDIATE_RECALL',
        scaffoldingUsed: true,
      },
      {
        timestamp: new Date().toISOString(),
        score: retainedScore,
        type: 'SPACED_RETRIEVAL',
        scaffoldingUsed: false,
      },
      {
        timestamp: new Date().toISOString(),
        score: farTransferScore,
        type: 'FAR_TRANSFER',
        scaffoldingUsed: false,
      },
    );
    this.trajectoryStore.set(key, trajectory);

    this.logger.log(
      `[RETENTION-TRANSFER] Evaluated learner ${learnerId} on ${conceptId}: Retained=${retainedScore}, FarTransfer=${farTransferScore}, Mastery=${overallTransferMastery}`,
    );

    return record;
  }

  /**
   * Retrieves retention and transfer record for a learner and concept.
   */
  getRetentionTransferRecord(learnerId: string, conceptId: string): RetentionTransferRecord | undefined {
    return this.retentionTransferLedger.get(`${learnerId}:${conceptId}`);
  }

  /**
   * Generates a personalized spaced retrieval schedule based on decay rate.
   */
  getSpacedRetrievalSchedule(learnerId: string, conceptId: string): number[] {
    const record = this.retentionTransferLedger.get(`${learnerId}:${conceptId}`);
    const decay = record?.retentionDecayRate ?? 0.05;

    // Fast decayers need tighter intervals; stable retainers get wider intervals
    if (decay > 0.08) {
      return [1, 2, 4, 7, 14]; // Rapid retrieval
    } else if (decay > 0.04) {
      return [1, 3, 7, 14, 30]; // Standard Leitner schedule
    } else {
      return [3, 7, 14, 30, 60]; // Expanded schedule
    }
  }

  /**
   * Generates transparent, human-readable personalization rationale (Clauses N17.36–N17.37).
   * Refuses opaque "AI selected this lesson".
   */
  generateExplainableRationale(
    learnerId: string,
    conceptId: string,
    recommendedActivityId: string,
  ): ExplainablePersonalizationRationale {
    const cluster = this.conceptClusters.get(conceptId);
    const conceptTitle = cluster?.conceptName || conceptId;
    const record = this.retentionTransferLedger.get(`${learnerId}:${conceptId}`);

    let rationaleText = '';
    let adjustment = 'Standard mastery pacing';

    if (!record) {
      rationaleText = `You are starting ${conceptTitle} for the first time. This activity introduces foundational concepts with intuitive visual models.`;
    } else if (!record.overallTransferMastery) {
      if (record.farTransferScore < 60) {
        rationaleText = `You did great on familiar ${conceptTitle} problems (${record.nearTransferScore}%), but struggled with unfamiliar applications (${record.farTransferScore}%). This activity introduces novel problem schemas so you can develop transferable problem-solving skills.`;
        adjustment = 'Increased schema variety to build Far Transfer capability';
      } else {
        rationaleText = `Your retention on ${conceptTitle} dipped to ${record.retainedScore}% after ${record.retentionIntervalDays} days. This spaced refresher reinforces long-term memory.`;
        adjustment = 'Spaced retrieval reinforcement';
      }
    } else {
      rationaleText = `You have demonstrated verified transfer mastery in ${conceptTitle}. This enrichment activity challenges you to synthesize it with higher-order topics.`;
      adjustment = 'Enrichment and cross-disciplinary application';
    }

    return {
      learnerId,
      conceptId,
      recommendedActivityId,
      rationale: rationaleText,
      pastInteractionsAnalyzed: 12,
      difficultyAdjustmentRationale: adjustment,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves longitudinal trajectory points.
   */
  getTrajectory(learnerId: string, conceptId: string): LongitudinalMasteryPoint[] {
    return this.trajectoryStore.get(`${learnerId}:${conceptId}`) || [];
  }

  /**
   * Extracts pseudonymized, privacy-preserved research cohort data (Clauses N17.7–N17.9).
   * Enforces data boundary invariant: Operational Data != Research Data.
   */
  extractAnonymizedResearchCohort(): {
    cohortSize: number;
    anonymizedRecords: {
      pseudonymId: string;
      conceptId: string;
      normalizedImmediate: number;
      normalizedRetained: number;
      normalizedFarTransfer: number;
    }[];
    timestamp: string;
  } {
    const anonymized: {
      pseudonymId: string;
      conceptId: string;
      normalizedImmediate: number;
      normalizedRetained: number;
      normalizedFarTransfer: number;
    }[] = [];

    let counter = 1;
    for (const record of this.retentionTransferLedger.values()) {
      anonymized.push({
        pseudonymId: `RES-ANON-${(counter++).toString().padStart(5, '0')}`,
        conceptId: record.conceptId,
        normalizedImmediate: record.immediateRecallScore / 100,
        normalizedRetained: record.retainedScore / 100,
        normalizedFarTransfer: record.farTransferScore / 100,
      });
    }

    return {
      cohortSize: anonymized.length,
      anonymizedRecords: anonymized,
      timestamp: new Date().toISOString(),
    };
  }
}
