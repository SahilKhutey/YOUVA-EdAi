import { LoopPreventionPolicy } from '../policies/loop-prevention.policy';
import { EscalationService } from '../services/escalation.service';

describe('Loop Prevention & Escalations (LKC-13)', () => {
  describe('LoopPreventionPolicy', () => {
    let policy: LoopPreventionPolicy;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        learningOrchestration: {
          count: jest.fn().mockResolvedValue(0),
        },
      };
      policy = new LoopPreventionPolicy(mockPrisma);
    });

    it('should allow valid orchestration depth and block excessive depth', () => {
      expect(policy.checkDepth(2).allowed).toBe(true);
      expect(policy.checkDepth(3).allowed).toBe(true);

      const exceeded = policy.checkDepth(4);
      expect(exceeded.allowed).toBe(false);
      expect(exceeded.loopDetected).toBe(true);
      expect(exceeded.reason).toContain('Maximum orchestration depth exceeded');
    });

    it('should allow valid step retries and block excessive retries', () => {
      expect(policy.checkStepRetries(1).allowed).toBe(true);
      expect(policy.checkStepRetries(2).allowed).toBe(true);

      const exceeded = policy.checkStepRetries(3);
      expect(exceeded.allowed).toBe(false);
      expect(exceeded.loopDetected).toBe(true);
      expect(exceeded.reason).toContain('Step retry limit exceeded');
    });

    it('should detect repetition when count exceeds threshold within 24h window', async () => {
      mockPrisma.learningOrchestration.count.mockResolvedValue(3);

      const result = await policy.checkRepetition('tenant-1', 'learner-1', 'workflow-1');
      expect(result.allowed).toBe(false);
      expect(result.loopDetected).toBe(true);
      expect(result.reason).toContain('Repetition threshold reached');
    });

    it('should allow execution when repetition count is below threshold', async () => {
      mockPrisma.learningOrchestration.count.mockResolvedValue(1);

      const result = await policy.checkRepetition('tenant-1', 'learner-1', 'workflow-1');
      expect(result.allowed).toBe(true);
      expect(result.loopDetected).toBe(false);
    });
  });

  describe('EscalationService', () => {
    let service: EscalationService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        learningEscalation: {
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'esc-123',
              ...data,
              createdAt: new Date(),
              resolvedAt: null,
            }),
          ),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({
              id: where.id,
              tenantId: 'tenant-1',
              orchestrationId: 'orch-1',
              reason: 'Test reason',
              severity: 'HIGH',
              evidenceIds: ['ev-1'],
              recommendedAction: 'Take action',
              status: data.status,
              assignedTo: data.assignedTo,
              createdAt: new Date(),
              resolvedAt: data.resolvedAt ?? null,
            }),
          ),
        },
      };
      service = new EscalationService(mockPrisma);
    });

    it('should create an escalation with evidence and severity', async () => {
      const esc = await service.createEscalation({
        tenantId: 'tenant-1',
        orchestrationId: 'orch-1',
        reason: 'Autonomous loop detected',
        severity: 'HIGH',
        evidenceIds: ['ev-100', 'ev-101'],
        recommendedAction: 'Teacher intervention recommended',
      });

      expect(esc.id).toBe('esc-123');
      expect(esc.severity).toBe('HIGH');
      expect(esc.status).toBe('OPEN');
      expect(esc.evidenceIds).toEqual(['ev-100', 'ev-101']);
    });

    it('should acknowledge and resolve an escalation', async () => {
      const ack = await service.acknowledgeEscalation('esc-123', 'teacher-1');
      expect(ack.status).toBe('ACKNOWLEDGED');
      expect(ack.assignedTo).toBe('teacher-1');

      const resolved = await service.resolveEscalation('esc-123', 'teacher-1', 'Resolved after review');
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
    });
  });
});
