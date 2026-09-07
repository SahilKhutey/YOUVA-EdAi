import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateReleaseArtifactDto,
  ReleaseStatus,
  ReleaseValidation,
  ShadowComparison,
} from './release.types';

/**
 * Gatekeeper function: All mandatory tests (unit, integration, security, safety, regression, performance)
 * must pass before any artifact (model, prompt, content, workflow) can be approved for release.
 */
export function canRelease(validation: ReleaseValidation): boolean {
  return (
    validation.unitTestsPassed &&
    validation.integrationTestsPassed &&
    validation.securityTestsPassed &&
    validation.safetyTestsPassed &&
    validation.regressionTestsPassed &&
    validation.performancePassed
  );
}

@Injectable()
export class ReleaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a governed release artifact in DRAFT state.
   */
  async registerArtifact(dto: CreateReleaseArtifactDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.releaseArtifact.upsert({
      where: {
        artifactType_artifactKey_version: {
          artifactType: dto.artifactType,
          artifactKey: dto.artifactKey,
          version: dto.version,
        },
      },
      create: {
        artifactType: dto.artifactType,
        artifactKey: dto.artifactKey,
        version: dto.version,
        status: ReleaseStatus.DRAFT,
        riskLevel: dto.riskLevel,
        checksum: dto.checksum,
        validationJson: dto.validationJson,
      },
      update: {
        riskLevel: dto.riskLevel,
        checksum: dto.checksum,
        validationJson: dto.validationJson,
      },
    });
  }

  /**
   * Validates artifact against the release gates.
   */
  async validateArtifact(id: string, validation: ReleaseValidation) {
    const prismaClient = this.prisma as any;
    const artifact = await prismaClient.releaseArtifact.findUnique({ where: { id } });
    if (!artifact) {
      throw new NotFoundException(`Release artifact '${id}' not found`);
    }

    const passed = canRelease(validation);
    const newStatus = passed ? ReleaseStatus.APPROVED : ReleaseStatus.DRAFT;

    return prismaClient.releaseArtifact.update({
      where: { id },
      data: {
        status: newStatus,
        validationJson: JSON.stringify(validation),
        approvedAt: passed ? new Date() : null,
      },
    });
  }

  /**
   * Promotes an approved artifact to CANARY deployment.
   */
  async promoteToCanary(id: string) {
    const prismaClient = this.prisma as any;
    const artifact = await prismaClient.releaseArtifact.findUnique({ where: { id } });
    if (!artifact) {
      throw new NotFoundException(`Release artifact '${id}' not found`);
    }
    if (artifact.status !== ReleaseStatus.APPROVED) {
      throw new BadRequestException(`Artifact must be in APPROVED status before CANARY promotion (current: ${artifact.status})`);
    }

    return prismaClient.releaseArtifact.update({
      where: { id },
      data: { status: ReleaseStatus.CANARY },
    });
  }

  /**
   * Activates artifact globally after canary stability.
   */
  async activateArtifact(id: string, approvedBy: string) {
    const prismaClient = this.prisma as any;
    const artifact = await prismaClient.releaseArtifact.findUnique({ where: { id } });
    if (!artifact) {
      throw new NotFoundException(`Release artifact '${id}' not found`);
    }
    if (artifact.status !== ReleaseStatus.CANARY && artifact.status !== ReleaseStatus.APPROVED) {
      throw new BadRequestException(`Artifact must be in CANARY or APPROVED status before activation (current: ${artifact.status})`);
    }

    return prismaClient.releaseArtifact.update({
      where: { id },
      data: {
        status: ReleaseStatus.ACTIVE,
        activatedAt: new Date(),
        validationJson: JSON.stringify({
          ...JSON.parse(artifact.validationJson || '{}'),
          activatedBy: approvedBy,
        }),
      },
    });
  }

  /**
   * Rollback artifact immediately upon detecting anomalies or regressions.
   */
  async rollbackArtifact(id: string, reason: string) {
    const prismaClient = this.prisma as any;
    const artifact = await prismaClient.releaseArtifact.findUnique({ where: { id } });
    if (!artifact) {
      throw new NotFoundException(`Release artifact '${id}' not found`);
    }

    return prismaClient.releaseArtifact.update({
      where: { id },
      data: {
        status: ReleaseStatus.ROLLED_BACK,
        validationJson: JSON.stringify({
          ...JSON.parse(artifact.validationJson || '{}'),
          rollbackReason: reason,
          rolledBackAt: new Date().toISOString(),
        }),
      },
    });
  }

  /**
   * Evaluates candidate agent/model output against production model in shadow mode.
   */
  compareShadow(prodDecision: any, candidateDecision: any, requestId: string): ShadowComparison {
    const agreement = prodDecision.action === candidateDecision.action;
    const safetyDiff = prodDecision.safetyScore !== candidateDecision.safetyScore;

    return {
      requestId,
      productionDecision: JSON.stringify(prodDecision),
      candidateDecision: JSON.stringify(candidateDecision),
      agreement,
      productionScore: prodDecision.score,
      candidateScore: candidateDecision.score,
      safetyDifference: safetyDiff,
    };
  }

  /**
   * List release artifacts.
   */
  async listArtifacts(filters: { status?: string; artifactType?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.artifactType) where.artifactType = filters.artifactType;

    return prismaClient.releaseArtifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }
}
