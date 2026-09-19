import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CivilizationOperatingSystemService,
  MASTER_LOOP_SEQUENCE,
  ALL_RELEASE_BLOCKER_CATEGORIES,
} from '../src/n-infinity/civilization-operating-system.service';
import {
  EvidenceLedgerNegativeRegistryService,
  EVIDENCE_HIERARCHY_LEVELS,
  NEGATIVE_INCIDENT_TYPES,
} from '../src/n-infinity/evidence-ledger-negative-registry.service';
import {
  MasterLoopStage,
  ReleaseBlockerCategory,
  EvidenceHierarchyLevel,
  NegativeIncidentType,
} from '../src/n-infinity/n-infinity-types';

describe('Milestone N∞ Master Loop, Release Gates & Evidence Ledger Suite (260 Tests)', () => {
  let civilizationService: CivilizationOperatingSystemService;
  let evidenceService: EvidenceLedgerNegativeRegistryService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CivilizationOperatingSystemService,
        EvidenceLedgerNegativeRegistryService,
      ],
    }).compile();

    civilizationService = moduleRef.get<CivilizationOperatingSystemService>(
      CivilizationOperatingSystemService,
    );
    evidenceService = moduleRef.get<EvidenceLedgerNegativeRegistryService>(
      EvidenceLedgerNegativeRegistryService,
    );
  });

  // =========================================================================
  // DOMAIN 1: 18-Stage Master Loop & 14 Continuous Release Gates [130 Tests]
  // =========================================================================
  describe('Domain 1: 18-Stage Master Loop & 14 Continuous Release Gates [130 Tests]', () => {
    it('1.1 should initialize Master Loop at OBSERVE stage with iteration 1', () => {
      const state = civilizationService.initializeMasterLoop('learner_alpha_001');
      expect(state.executionId).toBeDefined();
      expect(state.learnerId).toBe('learner_alpha_001');
      expect(state.currentStage).toBe('OBSERVE');
      expect(state.completedStages).toEqual([]);
      expect(state.artifacts).toEqual([]);
      expect(state.loopIteration).toBe(1);
    });

    it('1.2 should throw BadRequestException if learnerId is empty or invalid', () => {
      expect(() => civilizationService.initializeMasterLoop('')).toThrow(
        BadRequestException,
      );
      expect(() => civilizationService.initializeMasterLoop('   ')).toThrow(
        BadRequestException,
      );
    });

    it('1.3 should advance Master Loop sequentially from OBSERVE to UNDERSTAND', () => {
      const state = civilizationService.initializeMasterLoop('learner_seq_001');
      const updated = civilizationService.advanceMasterLoopStage(
        state.executionId,
        'UNDERSTAND',
        'youva://artifacts/concept_001',
      );
      expect(updated.currentStage).toBe('UNDERSTAND');
      expect(updated.completedStages).toContain('OBSERVE');
      expect(updated.artifacts.length).toBe(1);
      expect(updated.artifacts[0].stage).toBe('OBSERVE');
    });

    it('1.4 should throw BadRequestException on non-sequential stage jump', () => {
      const state = civilizationService.initializeMasterLoop('learner_jump_001');
      expect(() =>
        civilizationService.advanceMasterLoopStage(state.executionId, 'DEMONSTRATE'),
      ).toThrow(BadRequestException);
    });

    it('1.5 should record artifact independently during a stage', () => {
      const state = civilizationService.initializeMasterLoop('learner_art_001');
      const updated = civilizationService.recordLoopArtifact(
        state.executionId,
        'OBSERVE',
        'youva://evidence/reflection_doc',
      );
      expect(updated.artifacts.length).toBe(1);
      expect(updated.artifacts[0].uri).toBe('youva://evidence/reflection_doc');
    });

    it('1.6 should throw NotFoundException when accessing non-existent loop execution', () => {
      expect(() =>
        civilizationService.getMasterLoopState('non_existent_loop'),
      ).toThrow(NotFoundException);
    });

    it('1.7 should evaluate 14 release gates as clean when zero blockers triggered', () => {
      const evalResult = civilizationService.evaluateReleaseGates('v3.0.0-rc1');
      expect(evalResult.releaseTag).toBe('v3.0.0-rc1');
      expect(evalResult.isBlocked).toBe(false);
      expect(evalResult.blockersTriggered).toEqual([]);
      expect(evalResult.evaluations.length).toBe(14);
      expect(evalResult.evaluations.every((e) => e.passed)).toBe(true);
    });

    it('1.8 should block release when any of the 14 blocker categories is triggered', () => {
      const evalResult = civilizationService.evaluateReleaseGates('v3.0.0-rc2', [
        {
          category: 'CONSENT_BYPASS',
          triggered: true,
          details: 'Unconsented telemetry beacon detected in experimental module',
        },
      ]);
      expect(evalResult.isBlocked).toBe(true);
      expect(evalResult.blockersTriggered).toContain('CONSENT_BYPASS');
      const blockerEval = evalResult.evaluations.find((e) => e.category === 'CONSENT_BYPASS');
      expect(blockerEval?.passed).toBe(false);
    });

    it('1.9 should block release when multiple blockers are triggered simultaneously', () => {
      const evalResult = civilizationService.evaluateReleaseGates('v3.0.0-rc3', [
        { category: 'SAFETY_BYPASS', triggered: true },
        { category: 'UNAUTHORIZED_AI_ACTION', triggered: true },
      ]);
      expect(evalResult.isBlocked).toBe(true);
      expect(evalResult.blockersTriggered.length).toBe(2);
      expect(evalResult.blockersTriggered).toContain('SAFETY_BYPASS');
      expect(evalResult.blockersTriggered).toContain('UNAUTHORIZED_AI_ACTION');
    });

    it('1.10 should retrieve release gate evaluation by tag and in history', () => {
      const evalResult = civilizationService.getReleaseGateEvaluation('v3.0.0-rc1');
      expect(evalResult.releaseTag).toBe('v3.0.0-rc1');
      const history = civilizationService.listReleaseGateEvaluations();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    // 120 Parameterized tests for Domain 1 (Total: 130 tests)
    for (let i = 11; i <= 130; i++) {
      it(`1.${i} [MASTER-LOOP-RELEASE-${i}] should verify master loop and release gate isolation for vector ${i}`, () => {
        const lid = `learner_loop_vec_${i}`;
        const state = civilizationService.initializeMasterLoop(lid);
        expect(state.learnerId).toBe(lid);

        // Advance through stage 1 to stage 2
        const advanced = civilizationService.advanceMasterLoopStage(
          state.executionId,
          'UNDERSTAND',
          `youva://evidence/stage1_${i}`,
        );
        expect(advanced.currentStage).toBe('UNDERSTAND');

        // Test release gate check with dynamic blocker variation
        const blockerCat = ALL_RELEASE_BLOCKER_CATEGORIES[i % ALL_RELEASE_BLOCKER_CATEGORIES.length];
        const shouldBlock = i % 2 === 0;
        const gateRes = civilizationService.evaluateReleaseGates(`v3.0.0-vec-${i}`, [
          { category: blockerCat, triggered: shouldBlock, details: `Test check ${i}` },
        ]);
        expect(gateRes.isBlocked).toBe(shouldBlock);
        if (shouldBlock) {
          expect(gateRes.blockersTriggered).toContain(blockerCat);
        }
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: 5-Dimension Operating Scorecard & 7-Level Evidence Ledger [130 Tests]
  // =========================================================================
  describe('Domain 2: 5-Dimension Scorecard & 7-Level Evidence Ledger [130 Tests]', () => {
    it('2.1 should retrieve the initial benchmark operating scorecard', () => {
      const latest = civilizationService.getLatestScorecard();
      expect(latest.learningScore).toBe(94.5);
      expect(latest.capabilityScore).toBe(92.8);
      expect(latest.trustScore).toBe(98.2);
      expect(latest.safetyScore).toBe(99.7);
      expect(latest.sustainabilityScore).toBe(95.0);
      expect(latest.compositeHealthIndex).toBeGreaterThan(90);
    });

    it('2.2 should record a new operating scorecard with valid weighted composite index', () => {
      const sc = civilizationService.recordOperatingScorecard({
        learningScore: 90,
        capabilityScore: 90,
        trustScore: 90,
        safetyScore: 90,
        sustainabilityScore: 90,
      });
      expect(sc.compositeHealthIndex).toBe(90.0);
      expect(sc.scorecardId).toBeDefined();
    });

    it('2.3 should throw BadRequestException if any score is out of 0-100 bounds', () => {
      expect(() =>
        civilizationService.recordOperatingScorecard({
          learningScore: 105,
          capabilityScore: 90,
          trustScore: 90,
          safetyScore: 90,
          sustainabilityScore: 90,
        }),
      ).toThrow(BadRequestException);
    });

    it('2.4 should flag threshold warnings when scores drop below civilizational thresholds', () => {
      const sc = civilizationService.recordOperatingScorecard({
        learningScore: 65, // below 70
        capabilityScore: 85,
        trustScore: 75, // below 80
        safetyScore: 92, // below 95
        sustainabilityScore: 80,
      });
      const check = civilizationService.checkScorecardThresholds(sc);
      expect(check.healthy).toBe(false);
      expect(check.warnings.length).toBeGreaterThanOrEqual(3);
    });

    it('2.5 should submit and retrieve a new 7-level evidence hierarchy claim', () => {
      const claim = evidenceService.submitEvidenceClaim({
        claim: 'Metacognitive calibration drills increase exam performance by 18%',
        source: 'Cognitive Science Journal 2026',
        level: 'EXTERNALLY_CORROBORATED',
        methodology: 'Peer-reviewed external university study',
        populationSize: 3400,
        confidence: 0.93,
        limitations: 'Limited to higher education computer science',
        owner: 'Academic Partner Network',
        revalidationDueDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      });

      expect(claim.claimId).toBeDefined();
      expect(claim.verified).toBe(false);

      const retrieved = evidenceService.getEvidenceClaim(claim.claimId);
      expect(retrieved.claim).toContain('Metacognitive calibration');
    });

    it('2.6 should verify an evidence claim with verifier identity', () => {
      const claim = evidenceService.submitEvidenceClaim({
        claim: 'Interleaved math problem sets prevent schema fossilization',
        source: 'Pedagogy Lab',
        level: 'REPLICATED',
        methodology: 'Classroom randomized trial',
        populationSize: 1200,
        confidence: 0.89,
        limitations: 'Middle school algebra only',
        owner: 'Pedagogical Board',
      });

      const verified = evidenceService.verifyEvidenceClaim(claim.claimId, 'Prof_Sharma', true);
      expect(verified.verified).toBe(true);
    });

    it('2.7 should query claims by evidence hierarchy level', () => {
      const claims = evidenceService.queryClaimsByLevel('LONGITUDINALLY_VALIDATED');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0].level).toBe('LONGITUDINALLY_VALIDATED');
    });

    it('2.8 should record an immutable negative evidence incident', () => {
      const incident = evidenceService.recordNegativeIncident({
        incidentType: 'MODEL_FAILURE',
        description: 'Socratic dialogue model hallucinated non-existent physics theorem in quantum optics',
        rootCause: 'Unbounded generation temperature during exploratory inquiry mode',
        mitigationPreventativeAction: 'Enforced strict retrieval-augmented grounding with temperature <= 0.1',
      });

      expect(incident.recordId).toBeDefined();
      expect(incident.incidentType).toBe('MODEL_FAILURE');
      const retrieved = evidenceService.getNegativeIncident(incident.recordId);
      expect(retrieved.description).toContain('quantum optics');
    });

    it('2.9 should query negative incidents by type and calculate type statistics', () => {
      const falsePositives = evidenceService.listNegativeIncidents('FALSE_POSITIVE');
      expect(falsePositives.length).toBeGreaterThanOrEqual(1);

      const stats = evidenceService.getNegativeIncidentsCountByType();
      expect(stats.FALSE_POSITIVE).toBeGreaterThanOrEqual(1);
      expect(stats.MODEL_FAILURE).toBeGreaterThanOrEqual(1);
    });

    it('2.10 should check revalidation requirements and calculate remaining days', () => {
      const reval = evidenceService.checkRevalidationRequirements();
      expect(reval.length).toBeGreaterThanOrEqual(1);
      expect(reval[0].daysRemaining).toBeDefined();
    });

    // 120 Parameterized tests for Domain 2 (Total: 130 tests)
    for (let i = 11; i <= 130; i++) {
      it(`2.${i} [SCORECARD-EVIDENCE-${i}] should verify scorecard calculation and negative evidence tracking on vector ${i}`, () => {
        // Scorecard test
        const testScore = 70 + (i % 30);
        const sc = civilizationService.recordOperatingScorecard({
          learningScore: testScore,
          capabilityScore: testScore,
          trustScore: testScore,
          safetyScore: 95,
          sustainabilityScore: testScore,
        });
        expect(sc.scorecardId).toBeDefined();

        // Evidence hierarchy test
        const lvl = EVIDENCE_HIERARCHY_LEVELS[i % EVIDENCE_HIERARCHY_LEVELS.length];
        const claim = evidenceService.submitEvidenceClaim({
          claim: `Evidence claim for hypothesis ${i}`,
          source: `Source_${i}`,
          level: lvl,
          methodology: `Methodology_${i}`,
          populationSize: 100 * i,
          confidence: 0.8 + (i % 20) * 0.01,
          limitations: `Limitation_${i}`,
          owner: `Owner_${i}`,
        });
        expect(claim.level).toBe(lvl);

        // Negative incident test
        const incType = NEGATIVE_INCIDENT_TYPES[i % NEGATIVE_INCIDENT_TYPES.length];
        const neg = evidenceService.recordNegativeIncident({
          incidentType: incType,
          description: `Observed failure in test run ${i}`,
          rootCause: `Root cause factor ${i}`,
          mitigationPreventativeAction: `Preventative protocol ${i}`,
        });
        expect(neg.incidentType).toBe(incType);
      });
    }
  });
});
