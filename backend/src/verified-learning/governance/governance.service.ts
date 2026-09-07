import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GovernanceDecisionDto,
  LearningProof,
} from './governance.types';

@Injectable()
export class GovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an auditable governance board decision.
   */
  async recordDecision(dto: GovernanceDecisionDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.governanceDecision.create({
      data: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        decision: dto.decision,
        reason: dto.reason,
        reviewerId: dto.reviewerId,
        policyVersion: dto.policyVersion,
      },
    });
  }

  /**
   * Retrieves governance decisions for an educational resource.
   */
  async getDecisionsForResource(resourceType: string, resourceId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.governanceDecision.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Constructs the complete, end-to-end Learning Proof chain for a learner and concept.
   */
  async generateLearningProof(learnerId: string, conceptId: string): Promise<LearningProof> {
    const prismaClient = this.prisma as any;

    const provenanceRecords = await prismaClient.evidenceProvenance.findMany({
      where: { learnerId, conceptId },
      orderBy: { occurredAt: 'desc' },
      take: 20,
    });

    const outcomeRecord = await prismaClient.learningOutcome.findFirst({
      where: { learnerId, conceptId },
      orderBy: { measuredAt: 'desc' },
    });

    const latestProvenance = provenanceRecords[0];

    return {
      learnerId,
      conceptId,
      evidence: {
        ids: provenanceRecords.map((p: any) => p.evidenceId),
        count: provenanceRecords.length,
        confidence: outcomeRecord ? 0.92 : 0.80,
      },
      intervention: latestProvenance?.interventionId
        ? {
            id: latestProvenance.interventionId,
            type: latestProvenance.source,
          }
        : undefined,
      outcome: outcomeRecord
        ? {
            baseline: outcomeRecord.baselineMastery,
            final: outcomeRecord.finalMastery,
            effect: Number((outcomeRecord.finalMastery - outcomeRecord.baselineMastery).toFixed(4)),
          }
        : undefined,
      provenance: {
        modelVersion: latestProvenance?.modelVersion ?? 'model-v1',
        policyVersion: latestProvenance?.policyVersion ?? '1.0.0',
        contentVersion: latestProvenance?.contentId ?? 'concept-standard-v1',
      },
      teacherReview: {
        reviewed: Boolean(latestProvenance?.teacherId),
        reviewerId: latestProvenance?.teacherId,
      },
    };
  }
}
