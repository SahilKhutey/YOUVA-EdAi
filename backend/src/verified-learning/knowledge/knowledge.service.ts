import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateKnowledgeDto,
  KnowledgeContributionDto,
  KnowledgeGateInput,
} from './knowledge.types';

/**
 * Gatekeeper for global learning knowledge: Ensures findings are privacy-approved,
 * safety-approved, high-evidence quality (>=0.8), independently replicated, and expert-reviewed.
 */
export function canEnterGlobalKnowledge(
  input: KnowledgeGateInput,
): boolean {
  return (
    input.privacyApproved &&
    input.safetyApproved &&
    input.evidenceQuality >= 0.8 &&
    input.replicated &&
    input.expertReviewed
  );
}

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Promotes a verified claim into the global knowledge registry after passing all gates.
   */
  async promoteClaimToKnowledge(
    gateInput: KnowledgeGateInput,
    dto: CreateKnowledgeDto,
  ) {
    if (!canEnterGlobalKnowledge(gateInput)) {
      throw new BadRequestException(
        'Cannot enter global knowledge: must be privacy-approved, safety-approved, replicated, expert-reviewed, and evidence quality >= 0.8.',
      );
    }

    const prismaClient = this.prisma as any;
    return prismaClient.verifiedLearningKnowledge.upsert({
      where: { claimId: dto.claimId },
      create: {
        claimId: dto.claimId,
        knowledgeType: dto.knowledgeType,
        statement: dto.statement,
        confidence: dto.confidence,
        evidenceCount: dto.evidenceCount,
        replicationCount: dto.replicationCount,
        scopeJson: JSON.stringify(dto.scopeJson),
        version: 1,
        status: 'ACTIVE',
      },
      update: {
        confidence: dto.confidence,
        evidenceCount: dto.evidenceCount,
        replicationCount: dto.replicationCount,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Retrieves verified learning knowledge by ID.
   */
  async getVerifiedKnowledge(id: string) {
    const prismaClient = this.prisma as any;
    const knowledge = await prismaClient.verifiedLearningKnowledge.findUnique({
      where: { id },
    });
    if (!knowledge) {
      throw new NotFoundException(`Verified learning knowledge '${id}' not found`);
    }
    return knowledge;
  }

  /**
   * Lists active global knowledge findings.
   */
  async listActive(knowledgeType?: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.verifiedLearningKnowledge.findMany({
      where: {
        status: 'ACTIVE',
        ...(knowledgeType ? { knowledgeType } : {}),
      },
      orderBy: {
        confidence: 'desc',
      },
      take: 100,
    });
  }

  /**
   * Retires obsolete or superseded knowledge findings.
   */
  async retireKnowledge(id: string, reason: string) {
    const knowledge = await this.getVerifiedKnowledge(id);
    const prismaClient = this.prisma as any;

    return prismaClient.verifiedLearningKnowledge.update({
      where: { id: knowledge.id },
      data: {
        status: 'RETIRED',
      },
    });
  }

  /**
   * Records an institutional knowledge contribution (without moving raw learner data).
   */
  async contributeKnowledge(dto: KnowledgeContributionDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.knowledgeContribution.create({
      data: {
        tenantId: dto.tenantId,
        claimId: dto.claimId,
        contributionType: dto.contributionType,
        evidenceCount: dto.evidenceCount,
        privacyMethod: dto.privacyMethod,
        status: 'PENDING',
      },
    });
  }
}
