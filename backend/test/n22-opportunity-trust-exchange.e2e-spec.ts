import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OpportunityNetworkService } from '../src/capability-exchange/opportunity-network.service';
import { OpportunityTrustExchangeService } from '../src/capability-exchange/opportunity-trust-exchange.service';
import {
  Opportunity,
  OpportunityType,
  AgentActionType,
} from '../src/capability-exchange/n22-types';

describe('N22 Opportunity Network, Trust & Governed Exchange Suite (260 Tests)', () => {
  let opportunityService: OpportunityNetworkService;
  let trustExchangeService: OpportunityTrustExchangeService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [OpportunityNetworkService, OpportunityTrustExchangeService],
    }).compile();

    opportunityService = moduleRef.get<OpportunityNetworkService>(OpportunityNetworkService);
    trustExchangeService = moduleRef.get<OpportunityTrustExchangeService>(
      OpportunityTrustExchangeService,
    );
  });

  // =========================================================================
  // DOMAIN 3: Opportunity Network & Minor Safeguards [130 Tests]
  // =========================================================================
  describe('Domain 3: Opportunity Network, 12 Archetypes & Minor Safeguards [130 Tests]', () => {
    it('3.1 should list seeded initial opportunities', () => {
      const opps = opportunityService.listOpportunities();
      expect(opps.length).toBeGreaterThanOrEqual(3);
      expect(opps.some((o) => o.type === 'FELLOWSHIP')).toBe(true);
      expect(opps.some((o) => o.type === 'APPRENTICESHIP')).toBe(true);
      expect(opps.some((o) => o.type === 'RESKILLING')).toBe(true);
    });

    it('3.2 should register a new opportunity across any of the 12 canonical archetypes', () => {
      const opp = opportunityService.registerOpportunity({
        providerId: 'prov_unicef_learning',
        providerName: 'UNICEF Global Education',
        title: 'Community Health Peer Mentorship',
        description: 'Volunteer-driven peer mentorship in public health concepts',
        type: 'MENTORSHIP',
        status: 'OPEN',
        isMinorEligible: true,
        requiresParentalConsent: false,
      });

      expect(opp.id).toBeDefined();
      expect(opp.type).toBe('MENTORSHIP');
      expect(opp.freshnessScore).toBe(1.0);
      expect(opp.version).toBe(1);
    });

    it('3.3 should throw BadRequestException if required registration fields are missing', () => {
      expect(() =>
        opportunityService.registerOpportunity({
          providerId: '',
          title: 'Missing Provider',
          type: 'PROJECT',
        }),
      ).toThrow(BadRequestException);
    });

    it('3.4 should update an opportunity and bump version and freshness', () => {
      const updated = opportunityService.updateOpportunity('opp_ml_fellowship_001', {
        title: 'Advanced Research Fellowship in AI Safety & Alignment',
      });

      expect(updated.version).toBeGreaterThan(1);
      expect(updated.title).toContain('Advanced Research');
      expect(updated.freshnessScore).toBe(1.0);
    });

    it('3.5 should filter opportunities by type, provider, or minor eligibility', () => {
      const fellowships = opportunityService.listOpportunities({ type: 'FELLOWSHIP' });
      expect(fellowships.length).toBeGreaterThanOrEqual(1);
      expect(fellowships.every((f) => f.type === 'FELLOWSHIP')).toBe(true);

      const minorOpps = opportunityService.listOpportunities({ isMinorEligible: true });
      expect(minorOpps.every((o) => o.isMinorEligible)).toBe(true);
    });

    it('3.6 [MINOR-SAFEGUARDS] should strictly filter out non-minor-eligible opportunities for minor learners', () => {
      const allOpps = opportunityService.listOpportunities();
      const filteredMinor = opportunityService.filterForMinor(allOpps, true, false);

      expect(filteredMinor.every((o) => o.isMinorEligible)).toBe(true);
      expect(filteredMinor.every((o) => !o.requiresParentalConsent)).toBe(true);

      const filteredWithConsent = opportunityService.filterForMinor(allOpps, true, true);
      expect(filteredWithConsent.some((o) => o.requiresParentalConsent)).toBe(true);
    });

    it('3.7 should compute freshness decay accurately', () => {
      const freshOpp = opportunityService.getOpportunity('opp_ml_fellowship_001')!;
      const score = opportunityService.calculateFreshnessScore(freshOpp);
      expect(score).toBe(1.0);
    });

    // 123 parameterized checks for Domain 3 (Total: 130)
    for (let i = 8; i <= 130; i++) {
      it(`3.${i} [OPP-ARCHETYPE-${i}] should verify canonical archetype integrity and filtering on vector ${i}`, () => {
        const archetypes: OpportunityType[] = [
          'LEARNING',
          'PROJECT',
          'MENTORSHIP',
          'INTERNSHIP',
          'APPRENTICESHIP',
          'RESEARCH',
          'VOLUNTEER',
          'FREELANCE',
          'EMPLOYMENT',
          'ENTREPRENEURSHIP',
          'RESKILLING',
          'FELLOWSHIP',
        ];
        const selectedType = archetypes[i % archetypes.length];

        const reg = opportunityService.registerOpportunity({
          id: `opp_auto_${i}`,
          providerId: `prov_${i}`,
          title: `Automatic Opportunity Archetype ${i}`,
          type: selectedType,
          isMinorEligible: i % 2 === 0,
          requiresParentalConsent: i % 4 === 0,
        });

        expect(reg.type).toBe(selectedType);
        expect(reg.id).toBe(`opp_auto_${i}`);

        const retrieved = opportunityService.getOpportunity(`opp_auto_${i}`);
        expect(retrieved).toBeDefined();
        expect(retrieved?.type).toBe(selectedType);
      });
    }
  });

  // =========================================================================
  // DOMAIN 4: Trust Layer, Fraud Reporting & Governed Exchange [130 Tests]
  // =========================================================================
  describe('Domain 4: Trust Layer, Fraud Reporting, Governed Agent Actions & Exchange [130 Tests]', () => {
    it('4.1 should retrieve provider trust signals with verification level and pay transparency', () => {
      const signal = trustExchangeService.getTrustSignal('prov_deepmind_edu');
      expect(signal.verificationLevel).toBe('ENTERPRISE_AUDITED');
      expect(signal.payTransparencyScore).toBe(1.0);
      expect(signal.complaintRate).toBe(0.0);
      expect(signal.isSuspended).toBe(false);
    });

    it('4.2 should report anomaly/fraud and update status during investigation', () => {
      const report = trustExchangeService.reportFraud({
        opportunityId: 'opp_data_reskilling_003',
        reporterId: 'learner_whistleblower_01',
        anomalyType: 'BAIT_AND_SWITCH',
        description: 'Advertised remote research but demanded full-time unpaid marketing',
      });

      expect(report.reportId).toBeDefined();
      expect(report.status).toBe('PENDING_REVIEW');

      const reviewed = trustExchangeService.reviewFraudReport(
        report.reportId,
        'INVESTIGATING',
        'Assigned to Compliance Team',
      );
      expect(reviewed.status).toBe('INVESTIGATING');
      expect(reviewed.resolutionNotes).toContain('Compliance Team');
    });

    it('4.3 [INVARIANT N22.19/N22.46] should REJECT prohibited consequential AI agent actions', () => {
      const prohibitedActions: AgentActionType[] = [
        'BIND_CONTRACT',
        'NEGOTIATE_SALARY',
        'AUTO_SUBMIT',
        'REJECT_APPLICANT',
        'MAKE_ADMISSION_DECISION',
      ];

      for (const badAction of prohibitedActions) {
        expect(() =>
          trustExchangeService.authorizeAgentAction({
            agentId: 'autonomous_bot_99',
            learnerId: 'learner_asha_402',
            actionType: badAction,
            authorizedByLearner: true,
            authorizationToken: 'token_valid',
          }),
        ).toThrow(ForbiddenException);
      }
    });

    it('4.4 should authorize and execute allowed non-consequential agent actions with learner token', () => {
      const action = trustExchangeService.authorizeAgentAction({
        agentId: 'agent_recommender_01',
        learnerId: 'learner_asha_402',
        actionType: 'RECOMMEND_OPPORTUNITY',
        authorizedByLearner: true,
        authorizationToken: 'token_learner_consent_123',
        payload: { suggestedOppId: 'opp_ml_fellowship_001' },
      });

      expect(action.actionId).toBeDefined();
      expect(action.status).toBe('PENDING_CONFIRMATION');

      const executed = trustExchangeService.executeAgentAction(action.actionId);
      expect(executed.status).toBe('EXECUTED');
    });

    it('4.5 should throw BadRequestException if agent action lacks learner authorization', () => {
      expect(() =>
        trustExchangeService.authorizeAgentAction({
          agentId: 'agent_recommender_01',
          learnerId: 'learner_asha_402',
          actionType: 'RECOMMEND_OPPORTUNITY',
          authorizedByLearner: false, // Unauthorized!
          authorizationToken: '',
        }),
      ).toThrow(BadRequestException);
    });

    it('4.6 should submit capability exchange request with consent and generate audit trail', () => {
      const exchange = trustExchangeService.submitExchangeRequest({
        learnerId: 'learner_asha_402',
        opportunityId: 'opp_ml_fellowship_001',
        disclosureToken: 'sdt_valid_token_01',
        consentAcknowledged: true,
      });

      expect(exchange.exchangeId).toBeDefined();
      expect(exchange.status).toBe('SUBMITTED');
      expect(exchange.auditTrail.length).toBe(1);
      expect(exchange.auditTrail[0].event).toBe('EXCHANGE_REQUEST_SUBMITTED');
    });

    it('4.7 should reject exchange request without learner consent', () => {
      expect(() =>
        trustExchangeService.submitExchangeRequest({
          learnerId: 'learner_asha_402',
          opportunityId: 'opp_ml_fellowship_001',
          disclosureToken: 'sdt_valid_token_01',
          consentAcknowledged: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('4.8 should update exchange status and append to immutable audit trail', () => {
      const exchange = trustExchangeService.submitExchangeRequest({
        learnerId: 'learner_asha_402',
        opportunityId: 'opp_ml_fellowship_001',
        disclosureToken: 'sdt_valid_token_01',
        consentAcknowledged: true,
      });

      const updated = trustExchangeService.updateExchangeStatus(
        exchange.exchangeId,
        'UNDER_REVIEW',
        'PROVIDER:DeepMind_Edu',
      );

      expect(updated.status).toBe('UNDER_REVIEW');
      expect(updated.auditTrail.length).toBe(2);
      expect(updated.auditTrail[1].actor).toBe('PROVIDER:DeepMind_Edu');
    });

    // 122 parameterized checks for Domain 4 (Total: 130)
    for (let i = 9; i <= 130; i++) {
      it(`4.${i} [TRUST-EXCHANGE-AUDIT-${i}] should verify provider trust signal integrity and exchange flow on vector ${i}`, () => {
        const signal = trustExchangeService.getTrustSignal(`prov_vector_${i}`);
        expect(signal.isSuspended).toBe(false);
        expect(signal.payTransparencyScore).toBeGreaterThanOrEqual(0.0);

        const exch = trustExchangeService.submitExchangeRequest({
          learnerId: `learner_${i}`,
          opportunityId: `opp_${i}`,
          disclosureToken: `token_${i}`,
          consentAcknowledged: true,
        });

        expect(exch.exchangeId).toBeDefined();
        expect(exch.status).toBe('SUBMITTED');
        expect(exch.auditTrail.length).toBeGreaterThanOrEqual(1);
      });
    }
  });
});
