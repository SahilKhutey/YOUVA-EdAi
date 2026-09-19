import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  GovernanceKillswitchIncidentService,
  PROHIBITED_AI_ACTIONS,
  ALL_KILL_SWITCH_SUBSYSTEMS,
  INCIDENT_LIFECYCLE_SEQUENCE,
} from '../src/n-infinity/governance-killswitch-incident.service';
import {
  CivilizationKillSwitchSubsystem,
  IncidentLifecycleStage,
} from '../src/n-infinity/n-infinity-types';

describe('Milestone N∞ Governance, Kill Switches & Incident Lifecycle Suite (260 Tests)', () => {
  let govService: GovernanceKillswitchIncidentService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [GovernanceKillswitchIncidentService],
    }).compile();

    govService = moduleRef.get<GovernanceKillswitchIncidentService>(
      GovernanceKillswitchIncidentService,
    );
  });

  // =========================================================================
  // DOMAIN 1: Final AI Authority Matrix & 9-Subsystem Kill Switches [130 Tests]
  // =========================================================================
  describe('Domain 1: Final AI Authority Matrix & 9-Subsystem Kill Switches [130 Tests]', () => {
    it('1.1 should allow legitimate instructional AI action within bounded autonomy', () => {
      const res = govService.validateAIAction('PROVIDE_FORMATIVE_FEEDBACK', {
        concept: 'Newtonian Forces',
      });
      expect(res.allowed).toBe(true);
    });

    it('1.2 should throw ForbiddenException when AI attempts HUMAN_POTENTIAL_RANKING', () => {
      expect(() =>
        govService.validateAIAction('HUMAN_POTENTIAL_RANKING', {
          learnerId: 'learner_101',
          predictedMaxLevel: 'MID_TIER',
        }),
      ).toThrow(ForbiddenException);
    });

    it('1.3 should throw ForbiddenException when AI attempts HUMAN_WORTH_EVALUATION', () => {
      expect(() =>
        govService.validateAIAction('HUMAN_WORTH_EVALUATION', {
          learnerId: 'learner_102',
        }),
      ).toThrow(ForbiddenException);
    });

    it('1.4 should throw ForbiddenException when AI attempts CONSEQUENTIAL_EMPLOYMENT_DECISION', () => {
      expect(() =>
        govService.validateAIAction('CONSEQUENTIAL_EMPLOYMENT_DECISION', {
          candidateId: 'cand_201',
          action: 'TERMINATE',
        }),
      ).toThrow(ForbiddenException);
    });

    it('1.5 should throw ForbiddenException when AI attempts MASTERY_OVERRIDE', () => {
      expect(() =>
        govService.validateAIAction('MASTERY_OVERRIDE', {
          learnerId: 'learner_103',
          teacherVerdict: 'NOT_MASTERED',
          aiDecision: 'FORCE_MASTERED',
        }),
      ).toThrow(ForbiddenException);
    });

    it('1.6 should record audit logs for both allowed and prohibited AI action attempts', () => {
      const logs = govService.getAIAuditLog();
      expect(logs.length).toBeGreaterThanOrEqual(5);
      expect(logs.some((l) => !l.allowed)).toBe(true);
    });

    it('1.7 should verify all 9 kill switch subsystems are initially untripped (operational)', () => {
      const all = govService.getAllKillSwitches();
      expect(all.length).toBe(10); // 9 subsystems + GLOBAL_EMERGENCY
      expect(all.every((s) => !s.isTripped)).toBe(true);
      expect(govService.isSubsystemOperational('AI_AUTONOMY')).toBe(true);
    });

    it('1.8 should trip an individual kill switch subsystem and mark it non-operational', () => {
      const sw = govService.tripKillSwitch(
        'AI_AUTONOMY',
        'Safety_Council_Officer',
        'Drift detected in prompt optimization',
      );
      expect(sw.isTripped).toBe(true);
      expect(sw.trippedBy).toBe('Safety_Council_Officer');
      expect(govService.isSubsystemOperational('AI_AUTONOMY')).toBe(false);
      expect(govService.isSubsystemOperational('CREDENTIAL_ISSUANCE')).toBe(true);
    });

    it('1.9 should reset a tripped kill switch with valid human authorization token', () => {
      const sw = govService.resetKillSwitch(
        'AI_AUTONOMY',
        'Chief_Safety_Officer',
        'AUTH-COUNCIL-TOKEN-2026',
      );
      expect(sw.isTripped).toBe(false);
      expect(govService.isSubsystemOperational('AI_AUTONOMY')).toBe(true);
    });

    it('1.10 should trip GLOBAL_EMERGENCY and disable all subsystems simultaneously', () => {
      govService.tripGlobalEmergency(
        'Executive_Safety_Director',
        'Civilization-wide audit test',
      );
      expect(govService.isSubsystemOperational('AI_AUTONOMY')).toBe(false);
      expect(govService.isSubsystemOperational('CREDENTIAL_ISSUANCE')).toBe(false);
      expect(govService.isSubsystemOperational('SAFETY_SENSITIVE')).toBe(false);

      // Reset global emergency for subsequent parameterized tests
      govService.resetKillSwitch(
        'GLOBAL_EMERGENCY',
        'Executive_Safety_Director',
        'AUTH-COUNCIL-TOKEN-2026',
      );
    });

    // 120 Parameterized tests for Domain 1 (Total: 130 tests)
    for (let i = 11; i <= 130; i++) {
      it(`1.${i} [GOVERNANCE-KILLSWITCH-${i}] should verify constitutional bounds and killswitch state on vector ${i}`, () => {
        const prohibitedAction = PROHIBITED_AI_ACTIONS[i % PROHIBITED_AI_ACTIONS.length];
        expect(() =>
          govService.validateAIAction(prohibitedAction, { vectorId: i }),
        ).toThrow(ForbiddenException);

        const subsystem = ALL_KILL_SWITCH_SUBSYSTEMS[i % ALL_KILL_SWITCH_SUBSYSTEMS.length];
        const status = govService.getKillSwitchStatus(subsystem);
        expect(status.subsystem).toBe(subsystem);

        // Test valid action
        const allowedRes = govService.validateAIAction(`LEGITIMATE_TASK_${i}`);
        expect(allowedRes.allowed).toBe(true);
      });
    }
  });

  // =========================================================================
  // DOMAIN 2: 8-Stage Incident Management Lifecycle & Postmortem [130 Tests]
  // =========================================================================
  describe('Domain 2: 8-Stage Incident Management Lifecycle & Postmortem [130 Tests]', () => {
    it('2.1 should declare a new incident at DECLARED stage with SEV-1 to SEV-4', () => {
      const inc = govService.declareIncident(
        'SEV-1',
        'Critical Latency in Child Safety Filter',
        'Incident_Commander_Asha',
        'Safety filter response exceeded 250ms threshold',
      );

      expect(inc.incidentId).toBeDefined();
      expect(inc.severity).toBe('SEV-1');
      expect(inc.currentStage).toBe('DECLARED');
      expect(inc.timeline.length).toBe(1);
      expect(inc.timeline[0].actor).toBe('Incident_Commander_Asha');
    });

    it('2.2 should throw BadRequestException if required incident fields are invalid', () => {
      expect(() =>
        govService.declareIncident('INVALID_SEV' as any, 'Title', 'Actor'),
      ).toThrow(BadRequestException);
      expect(() =>
        govService.declareIncident('SEV-2', '', 'Actor'),
      ).toThrow(BadRequestException);
    });

    it('2.3 should advance incident through lifecycle stages sequentially', () => {
      const inc = govService.declareIncident(
        'SEV-2',
        'Transient API Rate Limit',
        'Commander_Dev',
      );

      const triaged = govService.advanceIncidentStage(
        inc.incidentId,
        'TRIAGED',
        'Engineer_Bob',
        'Root cause identified as downstream third-party timeout',
      );
      expect(triaged.currentStage).toBe('TRIAGED');

      const contained = govService.advanceIncidentStage(
        inc.incidentId,
        'CONTAINED',
        'Engineer_Bob',
        'Traffic routed to secondary redundant provider',
      );
      expect(contained.currentStage).toBe('CONTAINED');
    });

    it('2.4 should throw BadRequestException if trying to transition backwards in incident lifecycle', () => {
      const inc = govService.declareIncident(
        'SEV-3',
        'Minor UI Glitch',
        'Commander_Dev',
      );

      govService.advanceIncidentStage(inc.incidentId, 'TRIAGED', 'Engineer_Bob');

      expect(() =>
        govService.advanceIncidentStage(inc.incidentId, 'DECLARED', 'Engineer_Bob'),
      ).toThrow(BadRequestException);
    });

    it('2.5 should attach postmortem URI and systemic improvement action item', () => {
      const inc = govService.declareIncident(
        'SEV-2',
        'Ecosystem Sync Timeout',
        'Commander_Dev',
      );

      govService.advanceIncidentStage(inc.incidentId, 'TRIAGED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'CONTAINED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'MITIGATED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'RECOVERED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'VERIFIED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'CLOSED', 'Commander_Dev');
      govService.advanceIncidentStage(inc.incidentId, 'POSTMORTEM', 'Commander_Dev');

      const updated = govService.attachPostmortem(
        inc.incidentId,
        'https://governance.youva.org/postmortems/inc_sync_001.pdf',
        'Increase circuit breaker timeout to 5000ms with exponential jitter backoff',
      );

      expect(updated.postmortemUri).toContain('inc_sync_001.pdf');
      expect(updated.systemicActionItem).toContain('circuit breaker');
    });

    it('2.6 should list active vs closed incidents correctly', () => {
      const active = govService.listActiveIncidents();
      const all = govService.listAllIncidents();
      expect(all.length).toBeGreaterThanOrEqual(active.length);
    });

    it('2.7 should throw NotFoundException when accessing non-existent incident', () => {
      expect(() => govService.getIncident('inc_non_existent')).toThrow(
        NotFoundException,
      );
    });

    it('2.8 should support full progression to SYSTEMIC_IMPROVEMENT', () => {
      const inc = govService.declareIncident('SEV-4', 'Telemetry drift', 'Engineer_C');
      for (let s = 1; s < INCIDENT_LIFECYCLE_SEQUENCE.length; s++) {
        govService.advanceIncidentStage(
          inc.incidentId,
          INCIDENT_LIFECYCLE_SEQUENCE[s],
          'Engineer_C',
        );
      }
      const finalState = govService.getIncident(inc.incidentId);
      expect(finalState.currentStage).toBe('SYSTEMIC_IMPROVEMENT');
      expect(finalState.timeline.length).toBe(9);
    });

    it('2.9 should throw BadRequestException if actor name is omitted on stage advance', () => {
      const inc = govService.declareIncident('SEV-3', 'Test Missing Actor', 'Actor_1');
      expect(() =>
        govService.advanceIncidentStage(inc.incidentId, 'TRIAGED', ''),
      ).toThrow(BadRequestException);
    });

    it('2.10 should throw BadRequestException if postmortem URI or action item is empty', () => {
      const inc = govService.declareIncident('SEV-3', 'Test Postmortem Validation', 'Actor_1');
      expect(() => govService.attachPostmortem(inc.incidentId, '', 'Action')).toThrow(
        BadRequestException,
      );
      expect(() => govService.attachPostmortem(inc.incidentId, 'https://uri', '')).toThrow(
        BadRequestException,
      );
    });

    // 120 Parameterized tests for Domain 2 (Total: 130 tests)
    for (let i = 11; i <= 130; i++) {
      it(`2.${i} [INCIDENT-LIFECYCLE-${i}] should verify incident lifecycle integrity and timeline audit on vector ${i}`, () => {
        const sev = (['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] as const)[i % 4];
        const inc = govService.declareIncident(
          sev,
          `Incident Test Vector ${i}`,
          `Commander_${i}`,
          `Notes for vector ${i}`,
        );
        expect(inc.severity).toBe(sev);

        const advanced = govService.advanceIncidentStage(
          inc.incidentId,
          'TRIAGED',
          `Analyst_${i}`,
        );
        expect(advanced.currentStage).toBe('TRIAGED');
        expect(advanced.timeline.length).toBe(2);
      });
    }
  });
});
