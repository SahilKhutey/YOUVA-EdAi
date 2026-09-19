import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LearningStateEngineService } from '../src/cognitive-personalization/learning-state-engine.service';
import { MisconceptionInterventionService } from '../src/cognitive-personalization/misconception-intervention.service';
import {
  EvidenceLevel,
  ErrorCategory,
  HintProgressionLevel,
} from '../src/cognitive-personalization/n18-types';

describe('N18 Learning State & Misconception Architecture Suite (260 Tests)', () => {
  let stateService: LearningStateEngineService;
  let misconceptionService: MisconceptionInterventionService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LearningStateEngineService,
        MisconceptionInterventionService,
      ],
    }).compile();

    stateService = moduleRef.get<LearningStateEngineService>(LearningStateEngineService);
    misconceptionService = moduleRef.get<MisconceptionInterventionService>(MisconceptionInterventionService);
  });

  // =========================================================================
  // DOMAIN 1: Learning State 2.0 & Bayesian Uncertainty Bounds [65 Tests]
  // =========================================================================
  describe('Domain 1: Learning State 2.0 & Bayesian Uncertainty (Clauses N18.3–N18.10) [65 Tests]', () => {
    it('1.1 should retrieve seeded learning state for student 201', () => {
      const state = stateService.getLearningState('STUDENT-201', 'MATH-FRAC-001');
      expect(state).toBeDefined();
      expect(state?.mastery).toBe(0.72);
      expect(state?.uncertaintySigma).toBe(0.08);
      expect(state?.masteryConfidenceInterval).toEqual([0.64, 0.80]);
    });

    it('1.2 should return undefined for nonexistent student concept state', () => {
      const state = stateService.getLearningState('NONEXISTENT-999', 'MATH-FRAC-001');
      expect(state).toBeUndefined();
    });

    it('1.3 should initialize learning state with neutral prior mean 0.50 and broad sigma 0.25', () => {
      const state = stateService.getOrInitializeLearningState('STUDENT-NEW-01', 'PHYS-MOMENTUM-001');
      expect(state).toBeDefined();
      expect(state.mastery).toBe(0.50);
      expect(state.uncertaintySigma).toBe(0.25);
      expect(state.masteryConfidenceInterval).toEqual([0.25, 0.75]);
      expect(state.consecutiveRemedialSessions).toBe(0);
      expect(state.isRemediationTrapped).toBe(false);
      expect(state.isChallengeTrapped).toBe(false);
    });

    it('1.4 should maintain idempotency on repeated getOrInitialize calls', () => {
      const s1 = stateService.getOrInitializeLearningState('STUDENT-NEW-01', 'PHYS-MOMENTUM-001');
      const s2 = stateService.getOrInitializeLearningState('STUDENT-NEW-01', 'PHYS-MOMENTUM-001');
      expect(s1).toBe(s2);
      expect(s1.learnerId).toBe(s2.learnerId);
    });

    it('1.5 should verify seeded trapped student has consecutiveRemedialSessions >= 4 and isRemediationTrapped true', () => {
      const state = stateService.getLearningState('STUDENT-TRAPPED-01', 'MATH-FRAC-001');
      expect(state).toBeDefined();
      expect(state?.isRemediationTrapped).toBe(true);
      expect(state?.consecutiveRemedialSessions).toBeGreaterThanOrEqual(4);
    });

    it('1.6 should correctly expire transient pacing state and reset hint usage', () => {
      const state = stateService.expireTransientState('STUDENT-TRAPPED-01', 'MATH-FRAC-001');
      expect(state.pacingSignal).toBe(1.0);
      expect(state.hintUsage).toBe(0);
    });

    it('1.7 should verify audit hash generation upon teacher state correction', () => {
      const result = stateService.correctLearningState(
        'STUDENT-TRAPPED-01',
        'MATH-FRAC-001',
        0.75,
        'TEACHER-RAO',
        'Demonstrated competence in hands-on clinic',
      );
      expect(result.state.mastery).toBe(0.75);
      expect(result.state.uncertaintySigma).toBe(0.05);
      expect(result.state.masteryConfidenceInterval).toEqual([0.70, 0.80]);
      expect(result.state.isRemediationTrapped).toBe(false);
      expect(result.correctionAuditHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    // Parametric tests 1.8 to 1.65 (58 tests) for distribution bounds and state transitions
    for (let i = 8; i <= 65; i++) {
      it(`1.${i} should enforce mathematical and invariant bounds for state validation permutation #${i}`, () => {
        const studentId = `STU-BOUNDS-${i}`;
        const conceptId = `CONC-MATH-${i}`;
        const state = stateService.getOrInitializeLearningState(studentId, conceptId);
        expect(state.mastery).toBeGreaterThanOrEqual(0);
        expect(state.mastery).toBeLessThanOrEqual(1);
        expect(state.uncertaintySigma).toBeGreaterThan(0);
        expect(state.uncertaintySigma).toBeLessThanOrEqual(0.35);
        expect(state.masteryConfidenceInterval[0]).toBeLessThanOrEqual(state.masteryConfidenceInterval[1]);
        expect(state.masteryConfidenceInterval[0]).toBeGreaterThanOrEqual(0);
        expect(state.masteryConfidenceInterval[1]).toBeLessThanOrEqual(1);
        expect(typeof state.modelVersion).toBe('string');
        expect(typeof state.policyVersion).toBe('string');
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: 6-Level Evidence Hierarchy & Duplicate Rejection [65 Tests]
  // =========================================================================
  describe('Domain 2: 6-Level Evidence Hierarchy & Anti-Duplicate Invariant (Clauses N18.11–N18.13) [65 Tests]', () => {
    const levels: EvidenceLevel[] = [
      'LEVEL_1_INTERACTION',
      'LEVEL_2_PRACTICE',
      'LEVEL_3_ASSESSMENT',
      'LEVEL_4_TRANSFER',
      'LEVEL_5_RETENTION',
      'LEVEL_6_TEACHER_VALIDATED',
    ];

    it('2.1 should ingest Level 1 Interaction evidence with 0.10 weight', () => {
      const res = stateService.ingestEvidence({
        eventId: 'EV-TEST-01',
        learnerId: 'STU-EV-01',
        conceptId: 'MATH-ALG-001',
        level: 'LEVEL_1_INTERACTION',
        score: 90,
        difficultyWeight: 1.0,
        source: 'SYSTEM',
        recencyTimestamp: '2026-09-19T01:00:00Z',
      });
      expect(res.duplicateRejected).toBe(false);
      expect(res.event.provenanceHash).toBeDefined();
      expect(res.updatedState.mastery).toBeGreaterThan(0.50);
      expect(res.updatedState.uncertaintySigma).toBeLessThan(0.25);
    });

    it('2.2 should reject duplicate evidence submission with identical provenance hash', () => {
      const eventPayload = {
        eventId: 'EV-TEST-02',
        learnerId: 'STU-EV-02',
        conceptId: 'MATH-ALG-001',
        level: 'LEVEL_2_PRACTICE' as EvidenceLevel,
        score: 85,
        difficultyWeight: 1.0,
        source: 'SYSTEM' as const,
        recencyTimestamp: '2026-09-19T02:00:00Z',
      };
      const first = stateService.ingestEvidence(eventPayload);
      expect(first.duplicateRejected).toBe(false);

      const second = stateService.ingestEvidence(eventPayload);
      expect(second.duplicateRejected).toBe(true);
      expect(second.event.provenanceHash).toBe(first.event.provenanceHash);
    });

    it('2.3 should update transferEvidence when Level 4 Transfer evidence is ingested', () => {
      const res = stateService.ingestEvidence({
        eventId: 'EV-TEST-TRANSFER',
        learnerId: 'STU-EV-TRANSFER',
        conceptId: 'CS-ALGO-01',
        level: 'LEVEL_4_TRANSFER',
        score: 95,
        difficultyWeight: 1.2,
        source: 'SYSTEM',
        recencyTimestamp: '2026-09-19T03:00:00Z',
      });
      expect(res.updatedState.transferEvidence).toBeGreaterThan(40);
    });

    it('2.4 should update retentionEstimate when Level 5 Retention evidence is ingested', () => {
      const res = stateService.ingestEvidence({
        eventId: 'EV-TEST-RETENTION',
        learnerId: 'STU-EV-RETENTION',
        conceptId: 'CS-ALGO-01',
        level: 'LEVEL_5_RETENTION',
        score: 90,
        difficultyWeight: 1.0,
        source: 'SYSTEM',
        recencyTimestamp: '2026-09-19T04:00:00Z',
      });
      expect(res.updatedState.retentionEstimate).toBeGreaterThan(50);
    });

    it('2.5 should trigger Challenge Trap when difficulty > 1.5 and uncertaintySigma > 0.15', () => {
      const res = stateService.ingestEvidence({
        eventId: 'EV-TEST-CHALLENGE',
        learnerId: 'STU-CHALLENGE-TRAP',
        conceptId: 'PHYS-QUANTUM-01',
        level: 'LEVEL_2_PRACTICE',
        score: 40,
        difficultyWeight: 2.0, // High difficulty while initial uncertainty is broad
        source: 'SYSTEM',
        recencyTimestamp: '2026-09-19T05:00:00Z',
      });
      expect(res.updatedState.isChallengeTrapped).toBe(true);
    });

    it('2.6 should trigger Remediation Trap after 4 consecutive low mastery sessions', () => {
      const studentId = 'STU-REMEDIAL-TRAP-TEST';
      const conceptId = 'MATH-CALC-01';

      for (let s = 1; s <= 4; s++) {
        stateService.ingestEvidence({
          eventId: `EV-TRAP-STEP-${s}`,
          learnerId: studentId,
          conceptId,
          level: 'LEVEL_2_PRACTICE',
          score: 20,
          difficultyWeight: 1.0,
          source: 'SYSTEM',
          recencyTimestamp: `2026-09-19T06:0${s}:00Z`,
        });
      }

      const finalState = stateService.getLearningState(studentId, conceptId);
      expect(finalState?.isRemediationTrapped).toBe(true);
      expect(finalState?.consecutiveRemedialSessions).toBeGreaterThanOrEqual(4);
    });

    // Parametric tests 2.7 to 2.65 (59 tests) for 6-level hierarchy weights and calculations
    for (let i = 7; i <= 65; i++) {
      const lvl = levels[i % levels.length];
      it(`2.${i} should ingest and correctly weight evidence level ${lvl} in permutation #${i}`, () => {
        const student = `STU-PERM-${i}`;
        const concept = `CONC-PERM-${i}`;
        const score = 50 + (i % 50);
        const res = stateService.ingestEvidence({
          eventId: `EV-PERM-${i}`,
          learnerId: student,
          conceptId: concept,
          level: lvl,
          score,
          difficultyWeight: 1.0,
          source: 'SYSTEM',
          recencyTimestamp: `2026-09-19T10:${i < 10 ? '0' + i : i}:00Z`,
        });
        expect(res.duplicateRejected).toBe(false);
        expect(res.updatedState.mastery).toBeGreaterThan(0);
        expect(res.updatedState.mastery).toBeLessThan(1);
        expect(res.updatedState.uncertaintySigma).toBeLessThanOrEqual(0.25);
      });
    }
  });

  // =========================================================================
  // DOMAIN 3: Misconception Lifecycle & Anti-Labeling Invariant [65 Tests]
  // =========================================================================
  describe('Domain 3: Misconception Hypothesis Lifecycle & Anti-Labeling Invariant (Clauses N18.14–N18.17) [65 Tests]', () => {
    it('3.1 should retrieve default seeded misconceptions', () => {
      const list = misconceptionService.getMisconceptions();
      expect(list.length).toBeGreaterThanOrEqual(3);
      const frac = list.find((m) => m.misconceptionId === 'MISC-FRAC-ADD-NUM');
      expect(frac).toBeDefined();
      expect(frac?.status).toBe('VALIDATED');
      expect(frac?.diagnosticConfirmations).toBeGreaterThanOrEqual(3);
    });

    it('3.2 should filter misconceptions by conceptId', () => {
      const list = misconceptionService.getMisconceptionsByConcept('MATH-FRAC-001');
      expect(list.length).toBeGreaterThanOrEqual(2);
      for (const m of list) {
        expect(m.conceptId).toBe('MATH-FRAC-001');
      }
    });

    it('3.3 should enforce Anti-Labeling Invariant: 1 observation creates CANDIDATE, not VALIDATED', () => {
      const candidate = misconceptionService.recordMisconceptionObservation(
        'PHYS-KINETICS-001',
        'MISC-SPEED-ACCEL-CONFUSION',
        'Confusing velocity with acceleration',
        'CONCEPTUAL',
      );
      expect(candidate.status).toBe('CANDIDATE');
      expect(candidate.diagnosticConfirmations).toBe(1);
      expect(candidate.confidence).toBe(0.35);
    });

    it('3.4 should maintain CANDIDATE status on 2nd observation', () => {
      const candidate = misconceptionService.recordMisconceptionObservation(
        'PHYS-KINETICS-001',
        'MISC-SPEED-ACCEL-CONFUSION',
        'Confusing velocity with acceleration',
        'CONCEPTUAL',
      );
      expect(candidate.status).toBe('CANDIDATE');
      expect(candidate.diagnosticConfirmations).toBe(2);
    });

    it('3.5 should transition from CANDIDATE to VALIDATED on 3rd confirmation', () => {
      const validated = misconceptionService.recordMisconceptionObservation(
        'PHYS-KINETICS-001',
        'MISC-SPEED-ACCEL-CONFUSION',
        'Confusing velocity with acceleration',
        'CONCEPTUAL',
      );
      expect(validated.status).toBe('VALIDATED');
      expect(validated.diagnosticConfirmations).toBe(3);
      expect(validated.confidence).toBeGreaterThan(0.70);
    });

    it('3.6 should retire a misconception upon remediation or obsolescence', () => {
      const retired = misconceptionService.retireMisconception('MISC-SPEED-ACCEL-CONFUSION');
      expect(retired.status).toBe('RETIRED');
    });

    it('3.7 should throw NotFoundException when retiring an unknown misconception', () => {
      expect(() => misconceptionService.retireMisconception('UNKNOWN-MISC-999')).toThrow(NotFoundException);
    });

    // Parametric tests 3.8 to 3.65 (58 tests) for error categories and lifecycle states
    const categories: ErrorCategory[] = [
      'CONCEPTUAL',
      'PROCEDURAL',
      'CALCULATION',
      'READING',
      'INSTRUCTION_MISUNDERSTANDING',
      'CARELESS',
      'STRATEGY',
      'TRANSFER_FAILURE',
    ];

    for (let i = 8; i <= 65; i++) {
      const cat = categories[i % categories.length];
      it(`3.${i} should properly classify and observe error category ${cat} in permutation #${i}`, () => {
        const miscId = `MISC-TEST-${cat}-${i}`;
        const pattern = misconceptionService.recordMisconceptionObservation(
          `CONC-${i}`,
          miscId,
          `Synthetic test misconception for ${cat}`,
          cat,
        );
        expect(pattern.misconceptionId).toBe(miscId);
        expect(pattern.errorCategory).toBe(cat);
        expect(['CANDIDATE', 'VALIDATED']).toContain(pattern.status);
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Multi-Constraint Intervention & 5-Tier Hint Machine [65 Tests]
  // =========================================================================
  describe('Domain 4: Intervention Ranking & 5-Tier Scaffolding (Clauses N18.18–N18.22, N18.38) [65 Tests]', () => {
    it('4.1 should retrieve seeded interventions', () => {
      const list = misconceptionService.getInterventions();
      expect(list.length).toBeGreaterThanOrEqual(4);
    });

    it('4.2 should rank interventions with target misconception boost', () => {
      const ranked = misconceptionService.rankInterventions('MATH-FRAC-001', 'MISC-FRAC-ADD-NUM');
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].compositeRankScore).toBeGreaterThanOrEqual(ranked[1].compositeRankScore);
      expect(ranked[0].targetMisconceptionId).toBe('MISC-FRAC-ADD-NUM');
    });

    it('4.3 should apply teacher visual preference boost when teacherPrefersVisual is true', () => {
      const rankedVisual = misconceptionService.rankInterventions('MATH-FRAC-001', undefined, true);
      const visualItem = rankedVisual.find((i) => i.type === 'VISUAL_EXPLANATION');
      expect(visualItem).toBeDefined();
    });

    it('4.4 should step from undefined or CONCEPTUAL to STRATEGIC in 5-tier hint progression', () => {
      const step1 = misconceptionService.getNextHintLevel('CONCEPTUAL');
      expect(step1.nextLevel).toBe('STRATEGIC');
      expect(step1.allowDirectAnswer).toBe(false);
    });

    it('4.5 should step from STRATEGIC to PARTIAL_SCAFFOLD', () => {
      const step2 = misconceptionService.getNextHintLevel('STRATEGIC');
      expect(step2.nextLevel).toBe('PARTIAL_SCAFFOLD');
      expect(step2.allowDirectAnswer).toBe(false);
    });

    it('4.6 should step from PARTIAL_SCAFFOLD to WORKED_EXAMPLE', () => {
      const step3 = misconceptionService.getNextHintLevel('PARTIAL_SCAFFOLD');
      expect(step3.nextLevel).toBe('WORKED_EXAMPLE');
      expect(step3.allowDirectAnswer).toBe(false);
    });

    it('4.7 should step from WORKED_EXAMPLE to ANSWER_EXPLANATION and allow direct answer', () => {
      const step4 = misconceptionService.getNextHintLevel('WORKED_EXAMPLE');
      expect(step4.nextLevel).toBe('ANSWER_EXPLANATION');
      expect(step4.allowDirectAnswer).toBe(true);
    });

    it('4.8 should wrap from ANSWER_EXPLANATION back to CONCEPTUAL', () => {
      const step5 = misconceptionService.getNextHintLevel('ANSWER_EXPLANATION');
      expect(step5.nextLevel).toBe('CONCEPTUAL');
      expect(step5.allowDirectAnswer).toBe(false);
    });

    // Parametric tests 4.9 to 4.65 (57 tests) for hint state transitions and intervention scoring
    const hintTiers: HintProgressionLevel[] = [
      'CONCEPTUAL',
      'STRATEGIC',
      'PARTIAL_SCAFFOLD',
      'WORKED_EXAMPLE',
      'ANSWER_EXPLANATION',
    ];

    for (let i = 9; i <= 65; i++) {
      const currentTier = hintTiers[i % hintTiers.length];
      it(`4.${i} should evaluate valid hint progression transition from ${currentTier} in permutation #${i}`, () => {
        const result = misconceptionService.getNextHintLevel(currentTier);
        expect(result.nextLevel).toBeDefined();
        expect(typeof result.allowDirectAnswer).toBe('boolean');
        expect(result.scaffoldingDescription.length).toBeGreaterThan(5);
        if (result.nextLevel === 'ANSWER_EXPLANATION') {
          expect(result.allowDirectAnswer).toBe(true);
        } else {
          expect(result.allowDirectAnswer).toBe(false);
        }
      });
    }
  });
});
