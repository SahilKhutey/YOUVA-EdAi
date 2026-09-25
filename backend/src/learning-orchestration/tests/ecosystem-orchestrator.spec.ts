import { EcosystemOrchestratorService } from '../services/ecosystem-orchestrator.service';
import { WorkflowExecutorService } from '../workflows/workflow-executor.service';
import { WorkflowRegistryService } from '../workflows/workflow-registry.service';
import { AutonomyPolicy } from '../policies/autonomy-policy';
import { ScopePolicy } from '../policies/scope-policy';
import { LoopPreventionPolicy } from '../policies/loop-prevention.policy';
import { EscalationService } from '../services/escalation.service';

describe('EcosystemOrchestratorService & WorkflowExecutor (LKC-13)', () => {
  let orchestratorService: EcosystemOrchestratorService;
  let executorService: WorkflowExecutorService;
  let registryService: WorkflowRegistryService;
  let autonomyPolicy: AutonomyPolicy;
  let scopePolicy: ScopePolicy;
  let loopPolicy: LoopPreventionPolicy;
  let escalationService: EscalationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      learningOrchestration: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'orch-101',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        findUnique: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve({
            id: where.id,
            tenantId: 'default-tenant',
            learnerId: 'learner-1',
            objective: 'Mastery Recovery',
            triggerType: 'LEARNER_MASTERY_DROP',
            autonomyLevel: 'SAFE_EXECUTE',
            status: 'APPROVED',
            workflowId: 'targeted-practice-v1',
            workflowVersion: '1.0.0',
            policyVersion: '1.0.0',
            scope: 'LEARNER',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            steps: [
              {
                id: 'step-1',
                orchestrationId: where.id,
                sequence: 1,
                actionType: 'ADJUST_DIFFICULTY',
                targetType: 'PRACTICE_SESSION',
                targetId: 'session-1',
                status: 'PENDING',
                dependsOn: [],
                payload: {},
                compensationAction: 'RESET_DIFFICULTY',
                startedAt: null,
                completedAt: null,
                createdAt: new Date(),
              },
              {
                id: 'step-2',
                orchestrationId: where.id,
                sequence: 2,
                actionType: 'SCHEDULE_REVIEW',
                targetType: 'SPACED_REVIEW',
                targetId: 'concept-1',
                status: 'PENDING',
                dependsOn: [1],
                payload: {},
                compensationAction: 'CANCEL_SCHEDULED_REVIEW',
                startedAt: null,
                completedAt: null,
                createdAt: new Date(),
              },
            ],
            escalations: [],
          }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            status: data.status,
            metadata: data.metadata,
          }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      orchestrationStep: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'step-' + data.sequence,
            ...data,
            createdAt: new Date(),
          }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            ...data,
          }),
        ),
      },
      learningEscalation: {
        create: jest.fn().mockResolvedValue({
          id: 'esc-1',
          severity: 'HIGH',
          status: 'OPEN',
          evidenceIds: [],
          createdAt: new Date(),
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      workflowDefinition: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    autonomyPolicy = new AutonomyPolicy();
    scopePolicy = new ScopePolicy();
    loopPolicy = new LoopPreventionPolicy(mockPrisma);
    registryService = new WorkflowRegistryService(mockPrisma);
    executorService = new WorkflowExecutorService(mockPrisma);
    escalationService = new EscalationService(mockPrisma);

    orchestratorService = new EcosystemOrchestratorService(
      mockPrisma,
      autonomyPolicy,
      scopePolicy,
      loopPolicy,
      registryService,
      executorService,
      escalationService,
    );
  });

  it('should trigger and automatically execute SAFE_EXECUTE workflow', async () => {
    const result = await orchestratorService.triggerOrchestration({
      learnerId: 'learner-1',
      objective: 'Practice recovery for concept A',
      triggerType: 'LEARNER_MASTERY_DROP',
      workflowId: 'targeted-practice-v1',
      scope: 'LEARNER',
      autonomyLevel: 'SAFE_EXECUTE',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('orch-101');
    expect(mockPrisma.learningOrchestration.create).toHaveBeenCalled();
    expect(result.explainability).toBeDefined();
    expect(result.explainability?.policyEvaluated.autonomyLevel).toBe('SAFE_EXECUTE');
  });

  it('should pause, resume, and cancel an orchestration', async () => {
    const paused = await orchestratorService.pauseOrchestration('orch-101');
    expect(paused.id).toBe('orch-101');
    expect(mockPrisma.learningOrchestration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PAUSED' } }),
    );

    const resumed = await orchestratorService.resumeOrchestration('orch-101');
    expect(resumed.id).toBe('orch-101');

    const cancelled = await orchestratorService.cancelOrchestration('orch-101', 'Teacher requested cancel');
    expect(cancelled.id).toBe('orch-101');
  });

  it('should execute step DAG with saga compensation on failure', async () => {
    // Step 2 will fail to verify saga compensation
    jest.spyOn<any, any>(executorService, 'dispatchAction').mockImplementation(
      async (actionType: string) => {
        if (actionType === 'SCHEDULE_REVIEW') {
          throw new Error('Scheduler database unreachable');
        }
        return { status: 'SUCCESS' };
      },
    );

    const compensateSpy = jest.spyOn<any, any>(executorService, 'compensateAction').mockResolvedValue(undefined);

    const summary = await executorService.executeOrchestration('orch-101');
    expect(summary.status).toBe('FAILED');
    expect(summary.compensatedSteps).toContain('step-1');
    expect(compensateSpy).toHaveBeenCalledWith(
      'RESET_DIFFICULTY',
      'PRACTICE_SESSION',
      'session-1',
      {},
    );
  });
});
