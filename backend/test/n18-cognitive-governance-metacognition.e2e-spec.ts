import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CognitiveMetacognitionService } from '../src/cognitive-personalization/cognitive-metacognition.service';
import { ThreeEvidenceGovernanceService } from '../src/cognitive-personalization/three-evidence-governance.service';
import { CognitiveStrategy } from '../src/cognitive-personalization/n18-types';

describe('N18 Cognitive Governance & Metacognition Architecture Suite (250 Tests)', () => {
  let metaService: CognitiveMetacognitionService;
  let govService: ThreeEvidenceGovernanceService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CognitiveMetacognitionService,
        ThreeEvidenceGovernanceService,
      ],
    }).compile();

    metaService = moduleRef.get<CognitiveMetacognitionService>(CognitiveMetacognitionService);
    govService = moduleRef.get<ThreeEvidenceGovernanceService>(ThreeEvidenceGovernanceService);
  });

  // =========================================================================
  // DOMAIN 1: 6-Stage Metacognitive Loop & Calibration [65 Tests]
  // =========================================================================
  describe('Domain 1: 6-Stage Metacognitive Loop & Confidence Calibration (Clauses N18.33–N18.40) [65 Tests]', () => {
    it('1.1 should start a metacognitive session in stage PERFORM with predicted score', () => {
      const session = metaService.startSession('STU-META-01', 'MATH-CALC-001', 85);
      expect(session.sessionId).toBeDefined();
      expect(session.stage).toBe('PERFORM');
      expect(session.predictedScore).toBe(85);
    });

    it('1.2 should record performance and flag OVERCONFIDENT when predicted - actual > 20', () => {
      const session = metaService.startSession('STU-META-02', 'MATH-CALC-001', 90);
      const updated = metaService.recordPerformance(session.sessionId, 60);
      expect(updated.stage).toBe('EXPLAIN');
      expect(updated.actualScore).toBe(60);
      expect(updated.calibrationDelta).toBe(30);
      expect(updated.calibrationBias).toBe('OVERCONFIDENT');
    });

    it('1.3 should record performance and flag UNDERCONFIDENT when predicted - actual < -20', () => {
      const session = metaService.startSession('STU-META-03', 'MATH-CALC-001', 50);
      const updated = metaService.recordPerformance(session.sessionId, 85);
      expect(updated.calibrationDelta).toBe(-35);
      expect(updated.calibrationBias).toBe('UNDERCONFIDENT');
    });

    it('1.4 should record performance and flag ACCURATE when divergence is within [-20, 20]', () => {
      const session = metaService.startSession('STU-META-04', 'MATH-CALC-001', 75);
      const updated = metaService.recordPerformance(session.sessionId, 78);
      expect(updated.calibrationDelta).toBe(-3);
      expect(updated.calibrationBias).toBe('ACCURATE');
    });

    it('1.5 should submit error explanation and advance stage to CHOOSE_STRATEGY', () => {
      const session = metaService.startSession('STU-META-05', 'MATH-CALC-001', 80);
      metaService.recordPerformance(session.sessionId, 55);
      const explained = metaService.submitErrorExplanation(
        session.sessionId,
        'I neglected the inner derivative in the chain rule step',
      );
      expect(explained.stage).toBe('CHOOSE_STRATEGY');
      expect(explained.errorExplanation).toContain('chain rule');
    });

    it('1.6 should select strategy, record retry, and complete metacognitive session', () => {
      const session = metaService.startSession('STU-META-06', 'MATH-CALC-001', 80);
      metaService.recordPerformance(session.sessionId, 55);
      metaService.submitErrorExplanation(session.sessionId, 'Forgot inner derivative');
      const completed = metaService.selectStrategyAndRetry(session.sessionId, 'COMPARE', 92);
      expect(completed.stage).toBe('COMPLETED');
      expect(completed.selectedStrategy).toBe('COMPARE');
      expect(completed.retryScore).toBe(92);
    });

    it('1.7 should throw NotFoundException on non-existent session ID', () => {
      expect(() => metaService.recordPerformance('UNKNOWN-SESS-999', 80)).toThrow(NotFoundException);
      expect(() => metaService.submitErrorExplanation('UNKNOWN-SESS-999', 'test')).toThrow(NotFoundException);
      expect(() => metaService.selectStrategyAndRetry('UNKNOWN-SESS-999', 'RETRIEVE', 80)).toThrow(NotFoundException);
    });

    // Parametric tests 1.8 to 1.65 (58 tests) for loop integrity and calibration thresholds
    for (let i = 8; i <= 65; i++) {
      it(`1.${i} should correctly calibrate prediction and outcome in permutation #${i}`, () => {
        const pred = 30 + (i % 65);
        const act = 20 + ((i * 7) % 75);
        const s = metaService.startSession(`STU-CALIB-${i}`, `CONC-${i}`, pred);
        const res = metaService.recordPerformance(s.sessionId, act);
        expect(res.stage).toBe('EXPLAIN');
        const expectedDelta = pred - act;
        expect(res.calibrationDelta).toBe(expectedDelta);
        if (expectedDelta > 20) {
          expect(res.calibrationBias).toBe('OVERCONFIDENT');
        } else if (expectedDelta < -20) {
          expect(res.calibrationBias).toBe('UNDERCONFIDENT');
        } else {
          expect(res.calibrationBias).toBe('ACCURATE');
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: Anti-Dependency & Task-Specific Strategy Repertoire [65 Tests]
  // =========================================================================
  describe('Domain 2: Anti-Dependency, AI Removal Test & Strategy Profiling (Clauses N18.41–N18.52) [65 Tests]', () => {
    it('2.1 should flag dependencyRisk and trigger scaffolding remedy when unassisted performance drops > 35%', () => {
      const result = metaService.conductAiRemovalTest(
        'STU-DEP-01',
        'PHYS-FORCE-001',
        92, // With AI
        52, // Without AI (drop = 40 > 35)
      );
      expect(result.dependencyRiskDetected).toBe(true);
      expect(result.scaffoldingRemedyTriggered).toBe(true);
      expect(result.deltaDrop).toBe(40);
    });

    it('2.2 should not flag dependency when drop is within acceptable threshold (<= 35%)', () => {
      const result = metaService.conductAiRemovalTest(
        'STU-DEP-02',
        'PHYS-FORCE-001',
        88,
        65, // drop = 23 <= 35
      );
      expect(result.dependencyRiskDetected).toBe(false);
      expect(result.scaffoldingRemedyTriggered).toBe(false);
      expect(result.deltaDrop).toBe(23);
    });

    it('2.3 should retrieve AI removal test result by testId', () => {
      const created = metaService.conductAiRemovalTest('STU-DEP-03', 'PHYS-FORCE-001', 85, 70);
      const fetched = metaService.getAiRemovalResult(created.testId);
      expect(fetched).toBeDefined();
      expect(fetched?.testId).toBe(created.testId);
    });

    it('2.4 should enforce Anti-Learning-Style Myth Invariant: isMythicalFixedStyle is false', () => {
      const strat = metaService.getStrategyEffectiveness('RETRIEVE', 'Mathematics');
      expect(strat).toBeDefined();
      expect(strat.isMythicalFixedStyle).toBe(false);
      expect(strat.averageMasteryGain).toBeGreaterThan(0.20);
    });

    it('2.5 should create new task-specific strategy record when requested for novel domain', () => {
      const strat = metaService.getStrategyEffectiveness('ELABORATE', 'Biology');
      expect(strat).toBeDefined();
      expect(strat.strategy).toBe('ELABORATE');
      expect(strat.conceptDomain).toBe('Biology');
      expect(strat.isMythicalFixedStyle).toBe(false);
    });

    it('2.6 should classify epistemic status for uncertainty statement', () => {
      const res = metaService.classifyEpistemicStatus('The results might indicate a secondary reaction occurs');
      expect(res.epistemicCategory).toBe('UNCERTAINTY');
    });

    it('2.7 should classify epistemic status for model prediction statement', () => {
      const res = metaService.classifyEpistemicStatus('The simulation indicates the trajectory converges');
      expect(res.epistemicCategory).toBe('MODEL_PREDICTION');
    });

    it('2.8 should classify epistemic status for hypothesis statement', () => {
      const res = metaService.classifyEpistemicStatus('We hypothesize the enzyme active site denatures at 60C');
      expect(res.epistemicCategory).toBe('HYPOTHESIS');
    });

    // Parametric tests 2.9 to 2.65 (57 tests) for AI removal test and strategy permutations
    const strategies: CognitiveStrategy[] = [
      'RETRIEVE',
      'ELABORATE',
      'COMPARE',
      'PREDICT',
      'EXPLAIN',
      'REFLECT',
      'TRANSFER',
    ];

    for (let i = 9; i <= 65; i++) {
      const s = strategies[i % strategies.length];
      it(`2.${i} should evaluate strategy ${s} in domain Perm-${i} maintaining invariant`, () => {
        const record = metaService.getStrategyEffectiveness(s, `Domain-${i}`);
        expect(record.strategy).toBe(s);
        expect(record.isMythicalFixedStyle).toBe(false);
        expect(record.averageMasteryGain).toBeGreaterThan(0);
        expect(record.retentionGain).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Three-Evidence Triangulation & Conflict Resolution [60 Tests]
  // =========================================================================
  describe('Domain 3: Three-Evidence Triangulation & Reconciliation (Clauses N18.66–N18.70) [60 Tests]', () => {
    it('3.1 should record teacher evidence in the governance ledger', () => {
      const record = govService.recordTeacherEvidence({
        learnerId: 'STU-TEACH-01',
        conceptId: 'MATH-QUAD-001',
        observation: 'Student accurately solved quadratic formula without prompt during board session',
        evidenceType: 'CLASSROOM_PERFORMANCE',
        confidence: 0.95,
        teacherId: 'TEACHER-SMITH',
        tenantId: 'TENANT-ALPHA',
      });
      expect(record.evidenceId).toMatch(/^TEV-/);
      expect(record.audited).toBe(true);
      expect(record.createdAt).toBeDefined();
    });

    it('3.2 should query teacher evidence by learner and concept', () => {
      const list = govService.getTeacherEvidence('STUDENT-201', 'MATH-FRAC-001');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].teacherId).toBe('TEACHER-RAO');
    });

    it('3.3 should detect high evidence conflict when divergence > 25 points and schedule diagnostic task', () => {
      const conflict = govService.evaluateEvidenceConflict(
        'STU-CONF-01',
        'CHEM-STOICH-001',
        90, // System estimate
        55, // Teacher estimate (|90 - 55| = 35 > 25)
        80, // Learner self
      );
      expect(conflict.divergenceDelta).toBe(35);
      expect(conflict.resolutionStatus).toBe('PENDING_DIAGNOSTIC');
      expect(conflict.diagnosticTaskId).toBe('ACT-DIAG-RECONCILE-CHEM-STOICH-001');
    });

    it('3.4 should mark conflict as RESOLVED_RECONCILED when divergence <= 25 points', () => {
      const reconciled = govService.evaluateEvidenceConflict(
        'STU-CONF-02',
        'CHEM-STOICH-001',
        75,
        70, // divergence = 5 <= 25
        72,
      );
      expect(conflictIsResolved(reconciled.resolutionStatus)).toBe(true);
      expect(reconciled.divergenceDelta).toBe(5);
      expect(reconciled.diagnosticTaskId).toBeUndefined();
    });

    function conflictIsResolved(status: string): boolean {
      return status === 'RESOLVED_RECONCILED';
    }

    it('3.5 should resolve pending conflict with diagnostic score and rationale', () => {
      const conflict = govService.evaluateEvidenceConflict(
        'STU-CONF-03',
        'MATH-TRIG-001',
        85,
        45, // divergence = 40
        60,
      );
      expect(conflict.resolutionStatus).toBe('PENDING_DIAGNOSTIC');

      const resolved = govService.resolveConflictWithDiagnostic(
        conflict.conflictId,
        65,
        'Diagnostic task verified intermediate understanding with procedural arithmetic hesitation',
      );
      expect(resolved.resolutionStatus).toBe('RESOLVED_RECONCILED');
      expect(resolved.resolutionRationale).toContain('65%');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('3.6 should throw NotFoundException when resolving unknown conflict ID', () => {
      expect(() => govService.resolveConflictWithDiagnostic('UNKNOWN-CONF-999', 80, 'test')).toThrow(
        NotFoundException,
      );
    });

    // Parametric tests 3.7 to 3.60 (54 tests) for divergence calculations and resolutions
    for (let i = 7; i <= 60; i++) {
      it(`3.${i} should evaluate evidence conflict divergence correctly in permutation #${i}`, () => {
        const sys = 40 + (i % 60);
        const teach = 20 + ((i * 3) % 80);
        const learner = 50;
        const conf = govService.evaluateEvidenceConflict(`STU-TRI-${i}`, `CONC-${i}`, sys, teach, learner);
        const expectedDelta = Math.abs(sys - teach);
        expect(conf.divergenceDelta).toBe(expectedDelta);
        if (expectedDelta > 25) {
          expect(conf.resolutionStatus).toBe('PENDING_DIAGNOSTIC');
          expect(conf.diagnosticTaskId).toBeDefined();
        } else {
          expect(conf.resolutionStatus).toBe('RESOLVED_RECONCILED');
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Experiments, Simplicity Benchmark & Safety Invariants [60 Tests]
  // =========================================================================
  describe('Domain 4: Experiments, Simplicity Benchmark & Safety Invariants (Clauses N18.23–N18.26, N18.71, N18.136) [60 Tests]', () => {
    it('4.1 should retrieve default seeded experiments', () => {
      const exps = govService.getExperiments();
      expect(exps.length).toBeGreaterThanOrEqual(1);
      expect(exps[0].experimentId).toBe('EXP-N18-SPACING-01');
      expect(exps[0].primaryMetric).toBe('30d_uncued_retention_score');
    });

    it('4.2 should register a new experiment with primary metric and stop conditions', () => {
      const created = govService.registerExperiment({
        hypothesis: 'Interleaving geometry with algebra increases far transfer by >12%',
        populationDefinition: 'Grade 8 Math (N=800)',
        intervention: 'Interleaved Practice Engine',
        comparator: 'Blocked Practice',
        primaryMetric: 'far_transfer_composite_score',
        secondaryMetrics: ['time_on_task'],
        safetyMetrics: ['frustration_abandonment_rate'],
        stopConditions: ['abandonment_gt_12%'],
        status: 'PROPOSED',
      });
      expect(created.experimentId).toMatch(/^EXP-/);
      expect(created.primaryMetric).toBe('far_transfer_composite_score');
    });

    it('4.3 should reject experiment registration if primary metric is missing (Clause N18.25)', () => {
      expect(() =>
        govService.registerExperiment({
          hypothesis: 'Missing metric test',
          populationDefinition: 'All',
          intervention: 'A',
          comparator: 'B',
          primaryMetric: '', // Invalid!
          secondaryMetrics: [],
          safetyMetrics: [],
          stopConditions: ['stop_if_bad'],
          status: 'PROPOSED',
        }),
      ).toThrow(BadRequestException);
    });

    it('4.4 should reject experiment registration if stop conditions are missing (Clause N18.26)', () => {
      expect(() =>
        govService.registerExperiment({
          hypothesis: 'Missing stop condition test',
          populationDefinition: 'All',
          intervention: 'A',
          comparator: 'B',
          primaryMetric: 'accuracy',
          secondaryMetrics: [],
          safetyMetrics: [],
          stopConditions: [], // Invalid!
          status: 'PROPOSED',
        }),
      ).toThrow(BadRequestException);
    });

    it('4.5 should authorize production when complex model beats simple baseline by >= 5% (delta >= 0.05)', () => {
      const result = govService.evaluateSimplicityBenchmark('MODEL-DKT-V3', 0.78, 0.84); // delta = 0.06 >= 0.05
      expect(result.deltaAdvantage).toBe(0.06);
      expect(result.exceedsThreshold).toBe(true);
      expect(result.authorizedForProduction).toBe(true);
    });

    it('4.6 should reject production authorization when complex model delta < 0.05 over simple baseline', () => {
      const result = govService.evaluateSimplicityBenchmark('MODEL-TRANSFORMER-HEAVY', 0.80, 0.83); // delta = 0.03 < 0.05
      expect(result.deltaAdvantage).toBe(0.03);
      expect(result.exceedsThreshold).toBe(false);
      expect(result.authorizedForProduction).toBe(false);
    });

    it('4.7 should pass safety validation when no prohibited psychological or demographic attributes are present', () => {
      const safeCheck = govService.validatePersonalizationSafety({
        inferredAttributes: ['domain_mastery', 'pacing_rate', 'retention_half_life'],
        sensitiveDemographicsUsed: false,
      });
      expect(safeCheck.safe).toBe(true);
      expect(safeCheck.violations.length).toBe(0);
    });

    it('4.8 should detect violations when prohibited attributes (personality, mental health, iq) are present', () => {
      const unsafeCheck = govService.validatePersonalizationSafety({
        inferredAttributes: ['personality_type', 'depression_index', 'iq_score'],
        sensitiveDemographicsUsed: true,
      });
      expect(unsafeCheck.safe).toBe(false);
      expect(unsafeCheck.violations.length).toBeGreaterThanOrEqual(4);
      expect(unsafeCheck.violations.some((v) => v.includes('personality'))).toBe(true);
      expect(unsafeCheck.violations.some((v) => v.includes('sensitive demographic'))).toBe(true);
    });

    // Parametric tests 4.9 to 4.60 (52 tests) for simplicity benchmark boundary checks
    for (let i = 9; i <= 60; i++) {
      it(`4.${i} should evaluate simplicity benchmark boundary in permutation #${i}`, () => {
        const baseline = 0.70;
        const delta = (i % 20) * 0.01; // 0.00 to 0.19
        const complex = Number((baseline + delta).toFixed(3));
        const res = govService.evaluateSimplicityBenchmark(`MODEL-TEST-${i}`, baseline, complex);
        expect(res.deltaAdvantage).toBe(Number(delta.toFixed(3)));
        if (delta >= 0.05) {
          expect(res.authorizedForProduction).toBe(true);
          expect(res.exceedsThreshold).toBe(true);
        } else {
          expect(res.authorizedForProduction).toBe(false);
          expect(res.exceedsThreshold).toBe(false);
        }
      });
    }
  });
});
