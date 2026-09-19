import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  MetacognitiveLoopState,
  AiRemovalTestResult,
  CognitiveStrategy,
  TaskStrategyEffectiveness,
} from './n18-types';

@Injectable()
export class CognitiveMetacognitionService {
  private readonly logger = new Logger(CognitiveMetacognitionService.name);

  // In-memory active metacognitive sessions: key = sessionId
  private readonly metacognitiveSessions = new Map<string, MetacognitiveLoopState>();

  // In-memory AI removal test results
  private readonly aiRemovalResults = new Map<string, AiRemovalTestResult>();

  // In-memory strategy effectiveness data: key = `${strategy}:${conceptDomain}`
  private readonly strategyEffectiveness = new Map<string, TaskStrategyEffectiveness>();

  constructor() {
    this.seedDefaultStrategies();
  }

  private seedDefaultStrategies(): void {
    const defaults: TaskStrategyEffectiveness[] = [
      {
        strategy: 'RETRIEVE',
        conceptDomain: 'Mathematics',
        sampleCount: 120,
        averageMasteryGain: 0.28,
        retentionGain: 0.35,
        isMythicalFixedStyle: false,
      },
      {
        strategy: 'EXPLAIN',
        conceptDomain: 'Physics',
        sampleCount: 95,
        averageMasteryGain: 0.32,
        retentionGain: 0.40,
        isMythicalFixedStyle: false,
      },
      {
        strategy: 'COMPARE',
        conceptDomain: 'Mathematics',
        sampleCount: 110,
        averageMasteryGain: 0.30,
        retentionGain: 0.34,
        isMythicalFixedStyle: false,
      },
      {
        strategy: 'TRANSFER',
        conceptDomain: 'Computer Science',
        sampleCount: 80,
        averageMasteryGain: 0.35,
        retentionGain: 0.42,
        isMythicalFixedStyle: false,
      },
    ];

    for (const d of defaults) {
      this.strategyEffectiveness.set(`${d.strategy}:${d.conceptDomain}`, d);
    }
  }

  // --- METACOGNITIVE LEARNING LOOP API (Clause N18.46) ---

  /**
   * Starts a 6-stage metacognitive session with pre-task confidence prediction.
   */
  startSession(learnerId: string, conceptId: string, predictedScore: number): MetacognitiveLoopState {
    const sessionId = `META-SESS-${Date.now().toString(36).toUpperCase()}`;

    const session: MetacognitiveLoopState = {
      sessionId,
      learnerId,
      conceptId,
      predictedScore,
      stage: 'PERFORM',
      updatedAt: new Date().toISOString(),
    };

    this.metacognitiveSessions.set(sessionId, session);
    this.logger.log(`[METACOGNITION-START] Session ${sessionId} started for ${learnerId} with predicted score ${predictedScore}%`);
    return session;
  }

  /**
   * Records actual performance score and evaluates calibration delta.
   * Predict -> Perform -> Compare
   */
  recordPerformance(sessionId: string, actualScore: number): MetacognitiveLoopState {
    const session = this.metacognitiveSessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    session.actualScore = actualScore;
    session.calibrationDelta = session.predictedScore - actualScore;

    if (session.calibrationDelta > 20) {
      session.calibrationBias = 'OVERCONFIDENT';
    } else if (session.calibrationDelta < -20) {
      session.calibrationBias = 'UNDERCONFIDENT';
    } else {
      session.calibrationBias = 'ACCURATE';
    }

    session.stage = 'EXPLAIN';
    session.updatedAt = new Date().toISOString();

    this.logger.log(
      `[METACOGNITION-COMPARE] Session ${sessionId}: Pred=${session.predictedScore}%, Act=${actualScore}%, Bias=${session.calibrationBias}`,
    );

    return session;
  }

  /**
   * Submits learner's self-explanation of mistakes.
   * Compare -> Explain
   */
  submitErrorExplanation(sessionId: string, explanation: string): MetacognitiveLoopState {
    const session = this.metacognitiveSessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    session.errorExplanation = explanation;
    session.stage = 'CHOOSE_STRATEGY';
    session.updatedAt = new Date().toISOString();
    return session;
  }

  /**
   * Selects learning strategy and records unassisted retry.
   * Choose Strategy -> Retry -> Completed
   */
  selectStrategyAndRetry(
    sessionId: string,
    strategy: CognitiveStrategy,
    retryScore: number,
  ): MetacognitiveLoopState {
    const session = this.metacognitiveSessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    session.selectedStrategy = strategy;
    session.retryScore = retryScore;
    session.stage = 'COMPLETED';
    session.updatedAt = new Date().toISOString();

    this.logger.log(
      `[METACOGNITION-COMPLETE] Session ${sessionId} completed with strategy ${strategy} and retry score ${retryScore}%`,
    );

    return session;
  }

  getSession(sessionId: string): MetacognitiveLoopState | undefined {
    return this.metacognitiveSessions.get(sessionId);
  }

  // --- AI REMOVAL & INDEPENDENCE TEST (Clauses N18.44–N18.45) ---

  /**
   * Evaluates whether learner mastery endures without AI assistance.
   * If unassisted performance drops by >35%, flags dependency risk.
   */
  conductAiRemovalTest(
    learnerId: string,
    conceptId: string,
    performanceWithAi: number,
    performanceWithoutAi: number,
  ): AiRemovalTestResult {
    const testId = `AIR-TEST-${Date.now().toString(36).toUpperCase()}`;
    const deltaDrop = Math.max(0, performanceWithAi - performanceWithoutAi);
    const dependencyRisk = deltaDrop > 35;

    const result: AiRemovalTestResult = {
      testId,
      learnerId,
      conceptId,
      performanceWithAi,
      performanceWithoutAi,
      deltaDrop,
      dependencyRiskDetected: dependencyRisk,
      scaffoldingRemedyTriggered: dependencyRisk,
      timestamp: new Date().toISOString(),
    };

    this.aiRemovalResults.set(testId, result);

    if (dependencyRisk) {
      this.logger.warn(
        `[AI-DEPENDENCY-ALERT] Learner ${learnerId} performance dropped by ${deltaDrop}% without AI! Progressive scaffolding triggered.`,
      );
    }

    return result;
  }

  getAiRemovalResult(testId: string): AiRemovalTestResult | undefined {
    return this.aiRemovalResults.get(testId);
  }

  // --- TASK-SPECIFIC STRATEGY EVALUATION (Clauses N18.49–N18.52) ---

  /**
   * Rejects fixed learning-style myths (auditory/kinesthetic) and tracks task-specific strategy gains.
   */
  getStrategyEffectiveness(strategy: CognitiveStrategy, domain: string): TaskStrategyEffectiveness {
    const key = `${strategy}:${domain}`;
    let record = this.strategyEffectiveness.get(key);

    if (!record) {
      record = {
        strategy,
        conceptDomain: domain,
        sampleCount: 1,
        averageMasteryGain: 0.20,
        retentionGain: 0.25,
        isMythicalFixedStyle: false, // Invariant maintained
      };
      this.strategyEffectiveness.set(key, record);
    }

    return record;
  }

  // --- EPISTEMIC LEARNING (Clauses N18.97–N18.99) ---

  /**
   * Scaffolds learners to distinguish epistemic categories.
   */
  classifyEpistemicStatus(statement: string): {
    statement: string;
    epistemicCategory: 'FACT' | 'THEORY' | 'HYPOTHESIS' | 'MODEL_PREDICTION' | 'UNCERTAINTY';
    scaffoldingPrompt: string;
  } {
    const lower = statement.toLowerCase();

    if (lower.includes('might') || lower.includes('could') || lower.includes('uncertain')) {
      return {
        statement,
        epistemicCategory: 'UNCERTAINTY',
        scaffoldingPrompt: 'Notice the epistemic qualifiers: this statement acknowledges incomplete information.',
      };
    } else if (lower.includes('model predicts') || lower.includes('simulation indicates')) {
      return {
        statement,
        epistemicCategory: 'MODEL_PREDICTION',
        scaffoldingPrompt: 'This is an output generated by a mathematical model, which requires empirical validation.',
      };
    } else if (lower.includes('we hypothesize') || lower.includes('we suppose')) {
      return {
        statement,
        epistemicCategory: 'HYPOTHESIS',
        scaffoldingPrompt: 'This is a testable proposition that requires experimentation before acceptance.',
      };
    } else if (lower.includes('theory') || lower.includes('principle')) {
      return {
        statement,
        epistemicCategory: 'THEORY',
        scaffoldingPrompt: 'This is a comprehensive framework supported by substantial evidence.',
      };
    } else {
      return {
        statement,
        epistemicCategory: 'FACT',
        scaffoldingPrompt: 'This is an empirically verified observation within the curriculum.',
      };
    }
  }
}
