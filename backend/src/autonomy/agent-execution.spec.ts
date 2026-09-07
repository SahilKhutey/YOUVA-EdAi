import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AgentExecutionService } from './agent-execution.service';
import { AutonomyPolicyService } from './autonomy-policy.service';
import { AgentAction, AutonomyLevel } from './autonomy.types';

describe('AgentExecutionService', () => {
  let service: AgentExecutionService;
  let policyService: AutonomyPolicyService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      aIAgent: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      aIAgentExecution: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    policyService = new AutonomyPolicyService();
    service = new AgentExecutionService(prismaMock as any, policyService);
  });

  describe('Agent Validation', () => {
    it('throws NotFoundException when agent does not exist', async () => {
      prismaMock.aIAgent.findUnique.mockResolvedValue(null);

      await expect(
        service.executeAction({
          agentKey: 'missing-agent',
          action: AgentAction.RECOMMEND_ACTIVITY,
          payload: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when agent is INACTIVE', async () => {
      prismaMock.aIAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        key: 'inactive-agent',
        status: 'INACTIVE',
      });

      await expect(
        service.executeAction({
          agentKey: 'inactive-agent',
          action: AgentAction.RECOMMEND_ACTIVITY,
          payload: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Blocked Actions', () => {
    it('persists BLOCKED status and throws ForbiddenException on prohibited action', async () => {
      prismaMock.aIAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        key: 'tutor-agent',
        status: 'ACTIVE',
        autonomyLevel: AutonomyLevel.SUPERVISED,
      });

      prismaMock.aIAgentExecution.create.mockResolvedValue({
        id: 'exec-1',
        status: 'BLOCKED',
      });

      await expect(
        service.executeAction({
          agentKey: 'tutor-agent',
          action: AgentAction.MODIFY_MASTERY,
          payload: { learnerId: 'learner-1', newScore: 100 },
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.aIAgentExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AgentAction.MODIFY_MASTERY,
            status: 'BLOCKED',
          }),
        }),
      );
    });
  });

  describe('Human Approval Gating', () => {
    it('creates PENDING execution record for content assignment', async () => {
      prismaMock.aIAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        key: 'curriculum-agent',
        status: 'ACTIVE',
        autonomyLevel: AutonomyLevel.SUPERVISED,
      });

      prismaMock.aIAgentExecution.create.mockResolvedValue({
        id: 'exec-pending-1',
        status: 'PENDING',
      });

      const result = await service.executeAction({
        agentKey: 'curriculum-agent',
        action: AgentAction.ASSIGN_CONTENT,
        payload: { contentId: 'mod-1', learnerId: 'learner-1' },
      });

      expect(result.status).toBe('PENDING');
      expect(result.decision.requiresApproval).toBe(true);
      expect(prismaMock.aIAgentExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            action: AgentAction.ASSIGN_CONTENT,
          }),
        }),
      );
    });
  });

  describe('Low-Risk Autonomous Execution', () => {
    it('executes and records EXECUTED status with output hash for hint generation', async () => {
      prismaMock.aIAgent.findUnique.mockResolvedValue({
        id: 'agent-1',
        key: 'tutor-agent',
        status: 'ACTIVE',
        autonomyLevel: AutonomyLevel.BOUNDED_AUTONOMOUS,
      });

      prismaMock.aIAgentExecution.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-done-1', ...data }),
      );

      const result = await service.executeAction({
        agentKey: 'tutor-agent',
        action: AgentAction.GENERATE_HINT,
        payload: { context: 'Pythagorean Theorem', hintLevel: 2 },
      });

      expect(result.status).toBe('EXECUTED');
      expect(result.output).toBeDefined();
      expect(result.output.hintLevel).toBe(2);
      expect(prismaMock.aIAgentExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EXECUTED',
            outputHash: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('Approval & Rejection Workflow', () => {
    it('approves a pending execution and updates record', async () => {
      prismaMock.aIAgentExecution.findUnique.mockResolvedValue({
        id: 'exec-p1',
        status: 'PENDING',
        action: AgentAction.ASSIGN_CONTENT,
        metadataJson: { payload: { contentId: 'c1', learnerId: 'l1' } },
      });

      prismaMock.aIAgentExecution.update.mockResolvedValue({
        id: 'exec-p1',
        status: 'APPROVED',
        humanApprovedBy: 'teacher-1',
      });

      const updated = await service.approveExecution('exec-p1', 'teacher-1');

      expect(prismaMock.aIAgentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-p1' },
          data: expect.objectContaining({
            status: 'APPROVED',
            humanApprovedBy: 'teacher-1',
          }),
        }),
      );
      expect(updated.status).toBe('APPROVED');
    });

    it('rejects a pending execution with operator reason', async () => {
      prismaMock.aIAgentExecution.findUnique.mockResolvedValue({
        id: 'exec-p2',
        status: 'PENDING',
        action: AgentAction.ASSIGN_CONTENT,
      });

      prismaMock.aIAgentExecution.update.mockResolvedValue({
        id: 'exec-p2',
        status: 'REJECTED',
      });

      await service.rejectExecution('exec-p2', 'teacher-1', 'Not ready for this topic');

      expect(prismaMock.aIAgentExecution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-p2' },
          data: expect.objectContaining({
            status: 'REJECTED',
            errorCode: 'REJECTED_BY_HUMAN',
            errorDetails: 'Not ready for this topic',
          }),
        }),
      );
    });
  });
});
