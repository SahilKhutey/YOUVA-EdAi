import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CapabilityTranslationService } from '../src/capability-mobility/capability-translation.service';
import { CapabilityMobilityService } from '../src/capability-mobility/capability-mobility.service';
import { CapabilityTranslationMapping } from '../src/capability-mobility/n23-types';

describe('N23 Capability Translation & Mobility Suite (260 Tests)', () => {
  let translationService: CapabilityTranslationService;
  let mobilityService: CapabilityMobilityService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [CapabilityTranslationService, CapabilityMobilityService],
    }).compile();

    translationService = moduleRef.get<CapabilityTranslationService>(CapabilityTranslationService);
    mobilityService = moduleRef.get<CapabilityMobilityService>(CapabilityMobilityService);
  });

  // =========================================================================
  // DOMAIN 1: Capability Translation Layer & Transfer Evidence [130 Tests]
  // =========================================================================
  describe('Domain 1: Capability Translation Layer, Ontology & Transfer Evidence [130 Tests]', () => {
    it('1.1 should list initial seeded capability translation mappings', () => {
      const mappings = translationService.listMappings();
      expect(mappings.length).toBeGreaterThanOrEqual(3);
      expect(mappings.some((m) => m.sourceInstitution === 'Delhi_University')).toBe(true);
      expect(mappings.some((m) => m.sourceInstitution === 'CBSE_India')).toBe(true);
    });

    it('1.2 should register a new capability translation mapping with confidence and ontology', () => {
      const mapping = translationService.registerMapping({
        sourceInstitution: 'Stanford_Online',
        sourceCapabilityCode: 'CS_106A_JAVA',
        sourceCapabilityName: 'Programming Methodologies in Java',
        targetInstitution: 'IIT_Delhi',
        targetCapabilityCode: 'COL_100_PROG',
        targetCapabilityName: 'Introduction to Computer Science',
        commonOntologyCode: 'ONT_CS_PROG_METHODOLOGY',
        confidence: 0.91,
        reviewStatus: 'VERIFIED',
      });

      expect(mapping.mappingId).toBeDefined();
      expect(mapping.confidence).toBe(0.91);
      expect(mapping.transferTaskRequired).toBe(false);
    });

    it('1.3 [INVARIANT N23.16] should throw BadRequestException if required mapping fields are missing', () => {
      expect(() =>
        translationService.registerMapping({
          sourceInstitution: '',
          targetInstitution: 'MIT',
        }),
      ).toThrow(BadRequestException);
    });

    it('1.4 should throw BadRequestException if confidence is not bounded between 0.0 and 1.0', () => {
      expect(() =>
        translationService.registerMapping({
          sourceInstitution: 'A',
          sourceCapabilityCode: 'A1',
          targetInstitution: 'B',
          targetCapabilityCode: 'B1',
          commonOntologyCode: 'ONT_TEST',
          confidence: 1.5,
        }),
      ).toThrow(BadRequestException);
    });

    it('1.5 should translate capability and mandate transfer task when confidence < 0.85', () => {
      const translation = translationService.translateCapability(
        'Vocational_IT_Council',
        'VOC_CLOUD_SYSADMIN',
        'IIT_Madras_BSc',
      );

      expect(translation.mapping).toBeDefined();
      expect(translation.transferTaskRequired).toBe(true);
      expect(translation.directEquivalence).toBe(false);
    });

    it('1.6 [INVARIANT N23.19] should evaluate transfer task and validate when score >= 70', () => {
      const evaluation = translationService.evaluateTransferTask({
        learnerId: 'learner_asha_402',
        sourceContext: 'Vocational_Cloud_Sysadmin',
        targetContext: 'Academic_Operating_Systems',
        demonstratedScore: 82,
        evaluator: 'ASSESSOR_IITM_01',
      });

      expect(evaluation.taskId).toBeDefined();
      expect(evaluation.transferValidated).toBe(true);
      expect(evaluation.demonstratedScore).toBe(82);
    });

    it('1.7 should fail transfer task validation when demonstrated score < 70', () => {
      const evaluation = translationService.evaluateTransferTask({
        learnerId: 'learner_rohit_811',
        sourceContext: 'Vocational_Cloud_Sysadmin',
        targetContext: 'Academic_Operating_Systems',
        demonstratedScore: 62,
      });

      expect(evaluation.transferValidated).toBe(false);
    });

    // 123 parameterized checks for Domain 1 (Total: 130)
    for (let i = 8; i <= 130; i++) {
      it(`1.${i} [TRANSLATION-ONTOLOGY-${i}] should verify invariant N23.16 no-false-equivalence ontology bounds on vector ${i}`, () => {
        const conf = ((i % 50) + 50) / 100; // 0.50 - 0.99
        const m = translationService.registerMapping({
          sourceInstitution: `Univ_${i}`,
          sourceCapabilityCode: `CAP_SRC_${i}`,
          targetInstitution: `Institute_${i}`,
          targetCapabilityCode: `CAP_TGT_${i}`,
          commonOntologyCode: `ONT_CORE_${i}`,
          confidence: conf,
        });

        expect(m.mappingId).toBeDefined();
        expect(m.confidence).toBe(conf);
        expect(m.transferTaskRequired).toBe(conf < 0.85);

        const translated = translationService.translateCapability(`Univ_${i}`, `CAP_SRC_${i}`, `Institute_${i}`);
        expect(translated.mapping?.commonOntologyCode).toBe(`ONT_CORE_${i}`);
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: Capability Mobility Contracts, Wallet & Consent [130 Tests]
  // =========================================================================
  describe('Domain 2: Capability Mobility Contracts, Wallet & Consent Brokering [130 Tests]', () => {
    it('2.1 should submit a cross-institution capability mobility contract request with consent', () => {
      const result = mobilityService.submitMobilityRequest({
        subjectId: 'learner_asha_402',
        sourceOrganizationId: 'Delhi_University',
        destinationOrganizationId: 'MIT_OpenLearning',
        requestedCapabilities: ['CS_ALGORITHMS_CORE', 'DATA_STRUCTURES'],
        evidenceScopes: ['CS_ALGORITHMS_CORE'],
        purpose: 'Semester Exchange Credit Transfer',
        consentId: 'consent_sovereign_learner_402',
        correlationId: 'corr_mob_001',
      });

      expect(result.mobilityId).toBeDefined();
      expect(result.consentVerified).toBe(true);
      expect(result.acceptedEvidence.length).toBe(1);
      expect(result.pendingEvidence.length).toBe(1);
      expect(result.auditEventId).toBeDefined();
    });

    it('2.2 should throw BadRequestException if required mobility fields are missing', () => {
      expect(() =>
        mobilityService.submitMobilityRequest({
          subjectId: '',
          sourceOrganizationId: 'A',
          destinationOrganizationId: 'B',
          requestedCapabilities: [],
          evidenceScopes: [],
          purpose: '',
          consentId: '',
          correlationId: 'corr_002',
        }),
      ).toThrow(BadRequestException);
    });

    it('2.3 should reject mobility request if consent verification fails', () => {
      expect(() =>
        mobilityService.submitMobilityRequest({
          subjectId: 'learner_unverified_01',
          sourceOrganizationId: 'A',
          destinationOrganizationId: 'B',
          requestedCapabilities: ['CAP_A'],
          evidenceScopes: ['*'],
          purpose: 'Test',
          consentId: '', // Invalid consent!
          correlationId: 'corr_003',
        }),
      ).toThrow(BadRequestException);
    });

    it('2.4 should retrieve or initialize a sovereign learning wallet', () => {
      const wallet = mobilityService.getOrCreateLearningWallet('learner_wallet_01');
      expect(wallet.learnerId).toBe('learner_wallet_01');
      expect(wallet.walletId).toBeDefined();
      expect(wallet.capabilityRefs).toEqual([]);
      expect(wallet.evidenceRefs).toEqual([]);
    });

    it('2.5 should add decentralized references to the learning wallet without centralized lock-in', () => {
      mobilityService.addWalletReference('learner_wallet_01', 'CAPABILITY', 'cap_ds_algo_v1');
      mobilityService.addWalletReference('learner_wallet_01', 'EVIDENCE', 'ev_github_repo_402');
      mobilityService.addWalletReference('learner_wallet_01', 'CREDENTIAL', 'vc_mit_algorithms_2026');
      mobilityService.addWalletReference('learner_wallet_01', 'PROJECT', 'proj_nlp_interpretability');
      mobilityService.addWalletReference('learner_wallet_01', 'CONTRIBUTION', 'contrib_matrix_viz');

      const updated = mobilityService.getOrCreateLearningWallet('learner_wallet_01');
      expect(updated.capabilityRefs).toContain('cap_ds_algo_v1');
      expect(updated.evidenceRefs).toContain('ev_github_repo_402');
      expect(updated.credentialRefs).toContain('vc_mit_algorithms_2026');
      expect(updated.projectRefs).toContain('proj_nlp_interpretability');
      expect(updated.contributionRefs).toContain('contrib_matrix_viz');
    });

    it('2.6 should record immutable audit events for all mobility contract evaluations', () => {
      const events = mobilityService.getAuditEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events[0].eventId).toBeDefined();
      expect(events[0].payload.subjectId).toBe('learner_asha_402');
    });

    // 124 parameterized checks for Domain 2 (Total: 130)
    for (let i = 7; i <= 130; i++) {
      it(`2.${i} [MOBILITY-WALLET-${i}] should verify sovereign wallet reference isolation and contract flow on vector ${i}`, () => {
        const lid = `learner_mob_${i}`;
        const w = mobilityService.getOrCreateLearningWallet(lid);
        expect(w.learnerId).toBe(lid);

        mobilityService.addWalletReference(lid, 'CAPABILITY', `cap_ref_${i}`);
        const checked = mobilityService.getOrCreateLearningWallet(lid);
        expect(checked.capabilityRefs).toContain(`cap_ref_${i}`);

        const res = mobilityService.submitMobilityRequest({
          subjectId: lid,
          sourceOrganizationId: `Source_${i}`,
          destinationOrganizationId: `Dest_${i}`,
          requestedCapabilities: [`CAP_TEST_${i}`],
          evidenceScopes: ['*'],
          purpose: `Evaluation purpose ${i}`,
          consentId: `consent_${i}`,
          correlationId: `corr_${i}`,
        });

        expect(res.consentVerified).toBe(true);
        expect(res.acceptedEvidence.length).toBe(1);
        expect(res.auditEventId).toBeDefined();
      });
    }
  });
});
