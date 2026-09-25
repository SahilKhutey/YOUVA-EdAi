import { WorkflowRegistryService } from '../workflows/workflow-registry.service';

describe('WorkflowRegistryService (LKC-13)', () => {
  let service: WorkflowRegistryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workflowDefinition: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new WorkflowRegistryService(mockPrisma);
  });

  it('should initialize and provide built-in workflows', async () => {
    const workflows = await service.listWorkflows();
    expect(workflows.length).toBeGreaterThanOrEqual(4);

    const keys = workflows.map((w) => w.workflowKey);
    expect(keys).toContain('prerequisite-remediation-v1');
    expect(keys).toContain('targeted-practice-v1');
    expect(keys).toContain('concept-review-v1');
    expect(keys).toContain('systemic-gap-review-v1');
  });

  it('should filter workflows by scope', async () => {
    const learnerWorkflows = await service.listWorkflows({ scope: 'LEARNER' });
    expect(learnerWorkflows.length).toBeGreaterThanOrEqual(2);
    expect(learnerWorkflows.every((w) => w.scope === 'LEARNER')).toBe(true);

    const classWorkflows = await service.listWorkflows({ scope: 'CLASS' });
    expect(classWorkflows.every((w) => w.scope === 'CLASS')).toBe(true);
  });

  it('should retrieve a specific workflow definition by key and version', async () => {
    const wf = await service.getWorkflow('prerequisite-remediation-v1', '1.0.0');
    expect(wf).toBeDefined();
    expect(wf?.workflowKey).toBe('prerequisite-remediation-v1');
    expect(wf?.definition.steps.length).toBe(4);
    expect(wf?.definition.steps[0].actionType).toBe('TRIGGER_ASSESSMENT');
    expect(wf?.definition.steps[1].actionType).toBe('ASSIGN_REMEDIATION');
  });

  it('should register and upsert new custom workflows', async () => {
    const newWorkflow = {
      workflowKey: 'custom-mastery-boost-v1',
      version: '1.0.0',
      name: 'Custom Mastery Boost',
      status: 'ACTIVE' as const,
      scope: 'LEARNER' as const,
      autonomyLevel: 'SAFE_EXECUTE' as const,
      policyVersion: '1.0.0',
      definition: {
        steps: [
          {
            sequence: 1,
            actionType: 'TRIGGER_ASSESSMENT' as const,
            targetType: 'BOOST_QUIZ',
          },
        ],
      },
    };

    mockPrisma.workflowDefinition.upsert.mockResolvedValue({
      ...newWorkflow,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const registered = await service.registerWorkflow(newWorkflow);
    expect(registered.workflowKey).toBe('custom-mastery-boost-v1');
    expect(mockPrisma.workflowDefinition.upsert).toHaveBeenCalled();
  });
});
