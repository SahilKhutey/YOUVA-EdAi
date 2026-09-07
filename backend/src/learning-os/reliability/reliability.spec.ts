import { ForbiddenException } from '@nestjs/common';
import {
  reliabilityAutonomy,
  ReliabilityService,
} from './reliability.service';
import { AutonomyLevel, ReliabilityAction } from './reliability.types';

describe('Reliability Autopilot & Governance Invariants', () => {
  describe('reliabilityAutonomy', () => {
    it('allows safe worker restart', () => {
      expect(reliabilityAutonomy(ReliabilityAction.RESTART_WORKER)).toBe(
        AutonomyLevel.AUTO_LOW_RISK,
      );
    });

    it('blocks database schema changes', () => {
      expect(reliabilityAutonomy(ReliabilityAction.CHANGE_DATABASE_SCHEMA)).toBe(
        AutonomyLevel.BLOCKED,
      );
    });

    it('blocks safety disabling', () => {
      expect(reliabilityAutonomy(ReliabilityAction.DISABLE_SAFETY)).toBe(
        AutonomyLevel.BLOCKED,
      );
    });
  });

  describe('triggerRemediation', () => {
    let service: ReliabilityService;
    let prismaMock: any;

    beforeEach(() => {
      prismaMock = {};
      service = new ReliabilityService(prismaMock as any);
    });

    it('successfully executes safe action (RESTART_WORKER)', async () => {
      const result = await service.triggerRemediation(
        ReliabilityAction.RESTART_WORKER,
        'inference-worker-pod-2',
      );

      expect(result.status).toBe('EXECUTED');
      expect(result.action).toBe(ReliabilityAction.RESTART_WORKER);
    });

    it('throws ForbiddenException when attempting prohibited action (MODIFY_SECURITY_POLICY)', async () => {
      await expect(
        service.triggerRemediation(
          ReliabilityAction.MODIFY_SECURITY_POLICY,
          'jwt-policy-rule',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
