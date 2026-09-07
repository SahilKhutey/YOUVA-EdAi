import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyRecommendation } from './policy-recommendation.types';

@Injectable()
export class PolicyRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a governed system-level policy recommendation.
   * Invariant: Requires human approval. Cannot automatically rewrite or publish curriculum/policy.
   */
  async generateRecommendation(
    tenantId: string | null,
    dto: PolicyRecommendation,
  ) {
    const prismaClient = this.prisma as any;
    return prismaClient.policyRecommendation.create({
      data: {
        tenantId,
        scope: dto.scope,
        category: dto.category,
        recommendation: dto.recommendation,
        evidenceIdsJson: JSON.stringify(dto.evidenceIds),
        confidence: dto.confidence,
        requiresHumanApproval: true,
        status: 'PROPOSED',
      },
    });
  }

  /**
   * Approves a policy recommendation with administrator review.
   */
  async approveRecommendation(id: string, reviewerId: string) {
    const prismaClient = this.prisma as any;
    const rec = await prismaClient.policyRecommendation.findUnique({
      where: { id },
    });
    if (!rec) throw new NotFoundException('Policy recommendation not found.');

    return prismaClient.policyRecommendation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Lists recommendations for a tenant or platform.
   */
  async listRecommendations(tenantId?: string) {
    const prismaClient = this.prisma as any;
    const where: Record<string, any> = {};
    if (tenantId) where.tenantId = tenantId;

    return prismaClient.policyRecommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
