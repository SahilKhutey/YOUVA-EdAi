import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LearningStateEngineService } from './learning-state-engine.service';
import { MisconceptionInterventionService } from './misconception-intervention.service';
import { CognitiveMetacognitionService } from './cognitive-metacognition.service';
import { ThreeEvidenceGovernanceService } from './three-evidence-governance.service';
import {
  EvidenceLevel,
  ErrorCategory,
  HintProgressionLevel,
  CognitiveStrategy,
} from './n18-types';

@Controller('api/v1/cognitive')
export class CognitivePersonalizationController {
  constructor(
    private readonly stateEngine: LearningStateEngineService,
    private readonly misconceptionService: MisconceptionInterventionService,
    private readonly metacognitionService: CognitiveMetacognitionService,
    private readonly evidenceService: ThreeEvidenceGovernanceService,
  ) {}

  // --- LEARNING STATE ENGINE ---

  @Get('state/:learnerId/:conceptId')
  getLearningState(
    @Param('learnerId') learnerId: string,
    @Param('conceptId') conceptId: string,
  ) {
    return {
      success: true,
      data: this.stateEngine.getOrInitializeLearningState(learnerId, conceptId),
    };
  }

  @Post('evidence/ingest')
  ingestEvidence(
    @Body()
    body: {
      eventId: string;
      learnerId: string;
      conceptId: string;
      level: EvidenceLevel;
      score: number;
      difficultyWeight: number;
      recencyTimestamp: string;
      source: 'SYSTEM' | 'TEACHER' | 'LEARNER';
      provenanceHash?: string;
    },
  ) {
    return {
      success: true,
      data: this.stateEngine.ingestEvidence(body),
    };
  }

  @Post('state/correct')
  correctLearningState(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      correctedMastery: number;
      teacherId: string;
      rationale: string;
    },
  ) {
    return {
      success: true,
      data: this.stateEngine.correctLearningState(
        body.learnerId,
        body.conceptId,
        body.correctedMastery,
        body.teacherId,
        body.rationale,
      ),
    };
  }

  @Post('state/expire-transient')
  expireTransientState(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
    },
  ) {
    return {
      success: true,
      data: this.stateEngine.expireTransientState(body.learnerId, body.conceptId),
    };
  }

  // --- MISCONCEPTIONS & INTERVENTIONS ---

  @Get('misconceptions')
  getMisconceptions() {
    return { success: true, data: this.misconceptionService.getMisconceptions() };
  }

  @Post('misconceptions/observe')
  recordMisconceptionObservation(
    @Body()
    body: {
      conceptId: string;
      misconceptionId: string;
      description: string;
      category: ErrorCategory;
    },
  ) {
    return {
      success: true,
      data: this.misconceptionService.recordMisconceptionObservation(
        body.conceptId,
        body.misconceptionId,
        body.description,
        body.category,
      ),
    };
  }

  @Post('misconceptions/retire')
  retireMisconception(@Body() body: { misconceptionId: string }) {
    return {
      success: true,
      data: this.misconceptionService.retireMisconception(body.misconceptionId),
    };
  }

  @Get('interventions')
  getInterventions() {
    return { success: true, data: this.misconceptionService.getInterventions() };
  }

  @Post('interventions/rank')
  rankInterventions(
    @Body()
    body: {
      conceptId: string;
      targetMisconceptionId?: string;
      teacherPrefersVisual?: boolean;
    },
  ) {
    return {
      success: true,
      data: this.misconceptionService.rankInterventions(
        body.conceptId,
        body.targetMisconceptionId,
        body.teacherPrefersVisual,
      ),
    };
  }

  @Get('hints/next')
  getNextHintLevel(@Query('currentLevel') currentLevel?: HintProgressionLevel) {
    return {
      success: true,
      data: this.misconceptionService.getNextHintLevel(currentLevel),
    };
  }

  // --- METACOGNITION & AGENCY ---

  @Post('metacognition/start')
  startMetacognitiveSession(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      predictedScore: number;
    },
  ) {
    return {
      success: true,
      data: this.metacognitionService.startSession(
        body.learnerId,
        body.conceptId,
        body.predictedScore,
      ),
    };
  }

  @Post('metacognition/performance')
  recordPerformance(
    @Body()
    body: {
      sessionId: string;
      actualScore: number;
    },
  ) {
    return {
      success: true,
      data: this.metacognitionService.recordPerformance(body.sessionId, body.actualScore),
    };
  }

  @Post('metacognition/explain')
  submitErrorExplanation(
    @Body()
    body: {
      sessionId: string;
      explanation: string;
    },
  ) {
    return {
      success: true,
      data: this.metacognitionService.submitErrorExplanation(body.sessionId, body.explanation),
    };
  }

  @Post('metacognition/retry')
  selectStrategyAndRetry(
    @Body()
    body: {
      sessionId: string;
      strategy: CognitiveStrategy;
      retryScore: number;
    },
  ) {
    return {
      success: true,
      data: this.metacognitionService.selectStrategyAndRetry(
        body.sessionId,
        body.strategy,
        body.retryScore,
      ),
    };
  }

  @Post('ai-removal-test')
  conductAiRemovalTest(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      performanceWithAi: number;
      performanceWithoutAi: number;
    },
  ) {
    return {
      success: true,
      data: this.metacognitionService.conductAiRemovalTest(
        body.learnerId,
        body.conceptId,
        body.performanceWithAi,
        body.performanceWithoutAi,
      ),
    };
  }

  @Get('strategy-effectiveness')
  getStrategyEffectiveness(
    @Query('strategy') strategy: CognitiveStrategy,
    @Query('domain') domain: string,
  ) {
    return {
      success: true,
      data: this.metacognitionService.getStrategyEffectiveness(strategy, domain),
    };
  }

  @Post('epistemic-classify')
  classifyEpistemicStatus(@Body() body: { statement: string }) {
    return {
      success: true,
      data: this.metacognitionService.classifyEpistemicStatus(body.statement),
    };
  }

  // --- THREE-EVIDENCE GOVERNANCE & EXPERIMENTS ---

  @Post('teacher-evidence')
  recordTeacherEvidence(@Body() body: any) {
    return {
      success: true,
      data: this.evidenceService.recordTeacherEvidence(body),
    };
  }

  @Get('teacher-evidence/:learnerId')
  getTeacherEvidence(
    @Param('learnerId') learnerId: string,
    @Query('conceptId') conceptId?: string,
  ) {
    return {
      success: true,
      data: this.evidenceService.getTeacherEvidence(learnerId, conceptId),
    };
  }

  @Post('conflicts/evaluate')
  evaluateEvidenceConflict(
    @Body()
    body: {
      learnerId: string;
      conceptId: string;
      systemEstimate: number;
      teacherEstimate: number;
      learnerSelfRating: number;
    },
  ) {
    return {
      success: true,
      data: this.evidenceService.evaluateEvidenceConflict(
        body.learnerId,
        body.conceptId,
        body.systemEstimate,
        body.teacherEstimate,
        body.learnerSelfRating,
      ),
    };
  }

  @Post('conflicts/resolve')
  resolveConflict(
    @Body()
    body: {
      conflictId: string;
      diagnosticScore: number;
      resolutionRationale: string;
    },
  ) {
    return {
      success: true,
      data: this.evidenceService.resolveConflictWithDiagnostic(
        body.conflictId,
        body.diagnosticScore,
        body.resolutionRationale,
      ),
    };
  }

  @Get('conflicts')
  getConflicts() {
    return { success: true, data: this.evidenceService.getConflicts() };
  }

  @Get('experiments')
  getExperiments() {
    return { success: true, data: this.evidenceService.getExperiments() };
  }

  @Post('experiments')
  registerExperiment(@Body() body: any) {
    return { success: true, data: this.evidenceService.registerExperiment(body) };
  }

  @Post('simplicity-benchmark')
  evaluateSimplicityBenchmark(
    @Body()
    body: {
      modelId: string;
      simpleBaselineScore: number;
      complexModelScore: number;
    },
  ) {
    return {
      success: true,
      data: this.evidenceService.evaluateSimplicityBenchmark(
        body.modelId,
        body.simpleBaselineScore,
        body.complexModelScore,
      ),
    };
  }

  @Post('safety/validate')
  validateSafety(@Body() body: any) {
    return {
      success: true,
      data: this.evidenceService.validatePersonalizationSafety(body),
    };
  }
}
