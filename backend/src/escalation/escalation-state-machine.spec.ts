import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EscalationStateMachineService,
  EscalationStatus,
} from './escalation-state-machine.service';
import { Role } from '../auth/role.enum';

describe('P3 EscalationStateMachineService', () => {
  let stateMachine: EscalationStateMachineService;

  beforeEach(() => {
    stateMachine = new EscalationStateMachineService();
  });

  describe('Transition Invariants', () => {
    it('✓ permits valid progression: OPEN -> ASSIGNED', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.OPEN, EscalationStatus.ASSIGNED),
      ).toBe(true);
    });

    it('✓ permits valid progression: ASSIGNED -> REVIEWING', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.ASSIGNED, EscalationStatus.REVIEWING),
      ).toBe(true);
    });

    it('✓ permits valid progression: REVIEWING -> RESOLVED', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.REVIEWING, EscalationStatus.RESOLVED),
      ).toBe(true);
    });

    it('✓ permits direct close from OPEN: OPEN -> CLOSED', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.OPEN, EscalationStatus.CLOSED),
      ).toBe(true);
    });

    it('✓ rejects illegal backwards transition: RESOLVED -> OPEN', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.RESOLVED, EscalationStatus.OPEN),
      ).toBe(false);

      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.RESOLVED,
          EscalationStatus.OPEN,
          Role.TEACHER,
        ),
      ).toThrow(BadRequestException);
    });

    it('✓ rejects invalid progression: CLOSED -> REVIEWING', () => {
      expect(
        stateMachine.canTransition(EscalationStatus.CLOSED, EscalationStatus.REVIEWING),
      ).toBe(false);

      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.CLOSED,
          EscalationStatus.REVIEWING,
          Role.ADMIN,
        ),
      ).toThrow(BadRequestException);
    });

    it('✓ enforces that students cannot transition escalations', () => {
      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.OPEN,
          EscalationStatus.ASSIGNED,
          Role.STUDENT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('✓ enforces that non-human / unauthorized roles cannot resolve escalations', () => {
      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.REVIEWING,
          EscalationStatus.RESOLVED,
          undefined, // e.g. automated AI system call
        ),
      ).toThrow(ForbiddenException);
    });

    it('✓ allows authorized TEACHER or ADMIN to resolve escalations', () => {
      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.REVIEWING,
          EscalationStatus.RESOLVED,
          Role.TEACHER,
        ),
      ).not.toThrow();

      expect(() =>
        stateMachine.assertTransitionAllowed(
          EscalationStatus.REVIEWING,
          EscalationStatus.RESOLVED,
          Role.ADMIN,
        ),
      ).not.toThrow();
    });
  });
});
