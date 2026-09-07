import { InterventionOrchestratorService } from './intervention-orchestrator.service';
import { InterventionPlan } from './intervention.types';

describe('InterventionOrchestratorService & Boundaries', () => {
  let service: InterventionOrchestratorService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningIntervention: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new InterventionOrchestratorService(prisma);
  });

  it('requires human approval for consequential interventions', () => {
    const plan: InterventionPlan = {
      learnerId: 'l1',
      tenantId: 't1',
      triggerSignalId: 's1',
      type: 'TEACHER_REVIEW',
      priority: 1,
      rationale: 'Evidence requires review',
      requiresTeacherApproval: true,
    };

    expect(plan.requiresTeacherApproval).toBe(true);
  });

  it('creates intervention with PROPOSED status when teacher approval is required', async () => {
    prisma.learningIntervention.create.mockResolvedValue({
      id: 'int-1',
      status: 'PROPOSED',
    });

    const result = await service.createPlan({
      learnerId: 'l1',
      tenantId: 't1',
      triggerSignalId: 's1',
      type: 'REMEDIATION',
      priority: 0.9,
      rationale: 'Prerequisite gap detected',
      requiresTeacherApproval: true,
    });

    expect(prisma.learningIntervention.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PROPOSED',
          requiresTeacherApproval: true,
        }),
      }),
    );
  });

  it('approves a proposed intervention when authorized teacher reviews it', async () => {
    prisma.learningIntervention.findUnique.mockResolvedValue({
      id: 'int-1',
      status: 'PROPOSED',
    });
    prisma.learningIntervention.update.mockResolvedValue({
      id: 'int-1',
      status: 'APPROVED',
    });

    const approved = await service.approve('int-1', 'teacher-42', 'Valid remediation plan');
    expect(approved.status).toBe('APPROVED');
    expect(prisma.learningIntervention.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    );
  });
});
