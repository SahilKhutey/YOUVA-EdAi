import { HumanApprovalService } from './human-approval.service';

describe('HumanApprovalService', () => {
  let service: HumanApprovalService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      humanApproval: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      learningAction: {
        update: jest.fn(),
      },
    };
    service = new HumanApprovalService(prisma);
  });

  it('enqueues an action with PENDING decision', async () => {
    prisma.humanApproval.create.mockResolvedValue({ id: 'app-1', decision: 'PENDING' });

    const result = await service.requestApproval('act-1', 'tenant-1', 'ai-agent-1');
    expect(result.decision).toBe('PENDING');
    expect(prisma.humanApproval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionId: 'act-1',
          decision: 'PENDING',
        }),
      }),
    );
  });

  it('records approval and synchronizes action status to APPROVED', async () => {
    prisma.humanApproval.findUnique.mockResolvedValue({
      id: 'app-1',
      actionId: 'act-1',
    });
    prisma.humanApproval.update.mockResolvedValue({
      id: 'app-1',
      decision: 'APPROVE',
    });

    const result = await service.recordDecision('app-1', 'teacher-1', 'APPROVE', 'Looks good');
    expect(result.decision).toBe('APPROVE');
    expect(prisma.learningAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'act-1' },
        data: { status: 'APPROVED' },
      }),
    );
  });
});
