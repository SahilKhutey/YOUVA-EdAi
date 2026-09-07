import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ClaimVerification,
  CreateClaimDto,
  EvidenceQuality,
} from './claim.types';

/**
 * Calculates a multidimensional evidence quality score.
 */
export function evidenceQualityScore(input: EvidenceQuality): number {
  return (
    input.independence * 0.20 +
    input.consistency * 0.20 +
    input.completeness * 0.15 +
    input.provenance * 0.20 +
    input.outcomeStrength * 0.25
  );
}

/**
 * Verification gate: A claim must have minimum sample size, high evidence quality,
 * independent replications, safety and privacy reviews, and expert approval.
 */
export function canVerifyClaim(input: ClaimVerification): boolean {
  return (
    input.sampleSize >= 30 &&
    input.evidenceQuality >= 0.8 &&
    input.replicationCount >= 2 &&
    input.independentSources >= 1 &&
    input.safetyPassed &&
    input.privacyPassed &&
    input.reviewerApproved
  );
}

@Injectable()
export class ClaimService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a new learning claim in CANDIDATE status.
   */
  async createClaim(dto: CreateClaimDto, createdBy?: string) {
    const prismaClient = this.prisma as any;
    const claim = await prismaClient.learningClaim.create({
      data: {
        claimType: dto.claimType,
        statement: dto.statement,
        scopeJson: JSON.stringify(dto.scopeJson),
        status: 'CANDIDATE',
        createdBy,
        evidenceCount: dto.evidenceIds?.length ?? 0,
      },
    });

    if (dto.evidenceIds && dto.evidenceIds.length > 0) {
      await Promise.all(
        dto.evidenceIds.map((evidenceId) =>
          prismaClient.claimEvidence.create({
            data: {
              claimId: claim.id,
              evidenceId,
              weight: 1.0,
            },
          }).catch(() => null),
        ),
      );
    }

    return claim;
  }

  /**
   * Retrieves single claim by ID.
   */
  async getClaim(id: string) {
    const prismaClient = this.prisma as any;
    const claim = await prismaClient.learningClaim.findUnique({
      where: { id },
    });

    if (!claim) {
      throw new NotFoundException('Learning claim not found.');
    }
    return claim;
  }

  /**
   * Retrieves linked evidence items for a claim.
   */
  async getEvidence(id: string) {
    const prismaClient = this.prisma as any;
    await this.getClaim(id);

    return prismaClient.claimEvidence.findMany({
      where: { claimId: id },
    });
  }

  /**
   * Evaluates claim against verification criteria and promotes or rejects.
   */
  async verifyClaim(verification: ClaimVerification) {
    const claim = await this.getClaim(verification.claimId);
    const passes = canVerifyClaim(verification);

    if (!passes) {
      throw new BadRequestException(
        'Claim verification failed: requirements for sample size (>=30), quality (>=0.8), replication (>=2), safety, or approvals were not met.',
      );
    }

    const prismaClient = this.prisma as any;
    return prismaClient.learningClaim.update({
      where: { id: claim.id },
      data: {
        status: 'VERIFIED',
        confidence: verification.evidenceQuality,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Lists claims with filters.
   */
  async listClaims(filters: { status?: string; claimType?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.claimType) where.claimType = filters.claimType;

    return prismaClient.learningClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }
}
