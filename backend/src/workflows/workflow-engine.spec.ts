import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { StepType, WorkflowStatus } from './workflow.types';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let prismaMock: any;

  const mockWorkflowDefinition = {
    initialStepId: 'step-1',
    steps: {
      'step-1': {
        id: 'step-1',
        name: 'Generate Diagnostic Quiz',
        type: StepType.AI_GENERATION,
        nextStepId: 'step-2',
      },
      'step-2': {
        id: 'step-2',
        name: 'Teacher Review Gate',
        type: StepType.HUMAN_GATE,
        requiresApproval: true,
        nextStepId: 'step-3',
      },
      'step-3': {
        id: 'step-3',
        name: 'Assign Remedial Content',
        type: StepType.AUTO_TASK,
      },
    },
  };

  beforeEach(() => {
    prismaMock = {
      learningWorkflow: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      workflowExecution: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new WorkflowEngineService(prismaMock as any);
  });

  describe('Workflow Execution Start', () => {
    it('starts workflow in RUNNING state when initial step is auto/generation', async () => {
      prismaMock.learningWorkflow.findUnique.mockResolvedValue({
        id: 'wf-1',
        key: 'remediation-flow',
        definition: mockWorkflowDefinition,
      });

      prismaMock.workflowExecution.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-1', ...data }),
      );

      const exec = await service.startExecution('remediation-flow', 'learner-1');

      expect(exec.status).toBe(WorkflowStatus.RUNNING);
      expect(exec.state).toBe('step-1');
      expect(prismaMock.workflowExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: WorkflowStatus.RUNNING,
            state: 'step-1',
          }),
        }),
      );
    });

    it('starts workflow in WAITING_APPROVAL state when initial step is human gate', async () => {
      const gateFirstDefinition = {
        initialStepId: 'step-gate',
        steps: {
          'step-gate': {
            id: 'step-gate',
            name: 'Parent Consent Gate',
            type: StepType.HUMAN_GATE,
            requiresApproval: true,
          },
        },
      };

      prismaMock.learningWorkflow.findUnique.mockResolvedValue({
        id: 'wf-2',
        key: 'consent-flow',
        definition: gateFirstDefinition,
      });

      prismaMock.workflowExecution.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-2', ...data }),
      );

      const exec = await service.startExecution('consent-flow', 'learner-1');
      expect(exec.status).toBe(WorkflowStatus.WAITING_APPROVAL);
    });
  });

  describe('Step Transitions & Human Gates', () => {
    it('advances from step-1 to step-2 and pauses at human approval gate', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: WorkflowStatus.RUNNING,
        state: 'step-1',
        workflow: { definition: mockWorkflowDefinition },
        contextJson: { history: [] },
      });

      prismaMock.workflowExecution.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-1', ...data }),
      );

      const next = await service.stepForward('exec-1');

      expect(next.status).toBe(WorkflowStatus.WAITING_APPROVAL);
      expect(next.state).toBe('step-2');
    });

    it('rejects stepForward when execution is currently WAITING_APPROVAL', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: WorkflowStatus.WAITING_APPROVAL,
        state: 'step-2',
        workflow: { definition: mockWorkflowDefinition },
      });

      await expect(service.stepForward('exec-1')).rejects.toThrow(BadRequestException);
    });

    it('advances through human gate when approveGate is called', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: WorkflowStatus.WAITING_APPROVAL,
        state: 'step-2',
        workflow: { definition: mockWorkflowDefinition },
        contextJson: { history: [] },
      });

      prismaMock.workflowExecution.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-1', ...data }),
      );

      const approved = await service.approveGate('exec-1', 'teacher-admin');

      expect(approved.status).toBe(WorkflowStatus.RUNNING);
      expect(approved.state).toBe('step-3');
      expect(approved.contextJson.approvals[0].approvedBy).toBe('teacher-admin');
    });

    it('completes workflow when step has no subsequent steps', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: WorkflowStatus.RUNNING,
        state: 'step-3',
        workflow: { definition: mockWorkflowDefinition },
        contextJson: { history: [] },
      });

      prismaMock.workflowExecution.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-1', ...data }),
      );

      const completed = await service.stepForward('exec-1');
      expect(completed.status).toBe(WorkflowStatus.COMPLETED);
    });
  });

  describe('Illegal Transitions & Terminal States', () => {
    it('throws BadRequestException when stepping forward a COMPLETED execution', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-done',
        status: WorkflowStatus.COMPLETED,
        state: 'step-3',
        workflow: { definition: mockWorkflowDefinition },
      });

      await expect(service.stepForward('exec-done')).rejects.toThrow(BadRequestException);
    });

    it('allows cancelling an active running execution', async () => {
      prismaMock.workflowExecution.findUnique.mockResolvedValue({
        id: 'exec-run',
        status: WorkflowStatus.RUNNING,
        state: 'step-1',
        workflow: { definition: mockWorkflowDefinition },
      });

      prismaMock.workflowExecution.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'exec-run', ...data }),
      );

      const cancelled = await service.cancelExecution('exec-run', 'User requested stop');
      expect(cancelled.status).toBe(WorkflowStatus.CANCELLED);
    });
  });
});
