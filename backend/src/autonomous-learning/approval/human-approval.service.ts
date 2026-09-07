import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HumanApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueues an action into the unified human approval queue.
   */
  async requestApproval(actionId: string, tenantId: string, requestedBy: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.humanApproval.create({
      data: {
        actionId,
        tenantId,
        requestedBy,
        decision: 'PENDING',
      },
    });
  }

  /**
   * Records human reviewer's authoritative decision (APPROVE / REJECT).
   */
  async recordDecision(
    approvalId: string,
    reviewerId: string,
    decision: 'APPROVE' | 'MODIFY' | 'REJECT',
    rationale?: string,
  ) {
    const prismaClient = this.prisma as any;
    const approval = await prismaClient.humanApproval.findUnique({
      where: { id: approvalId },
    });
    if (!approval) throw new NotFoundException('Approval request not found.');

    const updated = await prismaClient.humanApproval.update({
      where: { id: approvalId },
      data: {
        reviewerId,
        decision,
        rationale: rationale ?? null,
        reviewedAt: new Date(),
      },
    });

    if (decision === 'APPROVE') {
      await prismaClient.learningAction.update({
        where: { id: approval.actionId },
        data: { status: 'APPROVED' },
      }).catch(() => null);
    } else if (decision === 'REJECT') {
      await prismaClient.learningAction.update({
        where: { id: approval.actionId },
        data: { status: 'DENIED' },
      }).catch(() => null);
    }

    return updated;
  }

  /**
   * Retrieves pending approvals for a tenant.
   */
  async getPendingApprovals(tenantId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.humanApproval.findMany({
      where: {
        tenantId,
        decision: 'PENDING',
      },
      orderBy: { requestedAt: 'desc' },
    });
  }
}
