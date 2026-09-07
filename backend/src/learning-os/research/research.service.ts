import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateResearchDatasetDto,
  ResearchRecord,
} from './research.types';

/**
 * Validates learning pattern significance threshold before promoting hypothesis to global knowledge.
 */
export function validatePattern(
  evidenceCount: number,
  confidence: number,
): boolean {
  return evidenceCount >= 30 && confidence >= 0.8;
}

@Injectable()
export class ResearchService {
  private static readonly RESEARCH_SALT = 'youva-privacy-research-salt-v1';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a proposed research dataset with a strict educational research purpose.
   */
  async createDataset(dto: CreateResearchDatasetDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.researchDataset.create({
      data: {
        name: dto.name,
        purpose: dto.purpose,
        sourceScope: dto.sourceScope,
        privacyMethod: dto.privacyMethod,
        schemaVersion: dto.schemaVersion ?? '1.0.0',
        status: 'DRAFT',
      },
    });
  }

  /**
   * Governance/IRB approval of a research dataset.
   */
  async approveDataset(id: string, approvedBy: string) {
    const prismaClient = this.prisma as any;
    const dataset = await prismaClient.researchDataset.findUnique({ where: { id } });
    if (!dataset) {
      throw new NotFoundException(`Research dataset '${id}' not found`);
    }

    return prismaClient.researchDataset.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days default retention
      },
    });
  }

  /**
   * Exports de-identified research records, stripping all PII and pseudonymizing learner identifiers.
   */
  async exportAnonymizedRecords(datasetId: string, rawEvidenceList: any[]): Promise<ResearchRecord[]> {
    const prismaClient = this.prisma as any;
    const dataset = await prismaClient.researchDataset.findUnique({ where: { id: datasetId } });
    if (!dataset) {
      throw new NotFoundException(`Research dataset '${datasetId}' not found`);
    }
    if (dataset.status !== 'APPROVED') {
      throw new BadRequestException(`Dataset '${datasetId}' is not approved for export (status: ${dataset.status})`);
    }

    return rawEvidenceList.map((item) => {
      // Deterministic pseudonymization via HMAC-SHA256
      const anonymousLearnerId = crypto
        .createHmac('sha256', ResearchService.RESEARCH_SALT)
        .update(item.learnerId || 'unknown-learner')
        .digest('hex')
        .substring(0, 16);

      // Truncate timestamp to date bucket (YYYY-MM-DD) to prevent timing correlation attacks
      const rawDate = item.occurredAt || item.measuredAt || new Date().toISOString();
      const timestampBucket = new Date(rawDate).toISOString().split('T')[0];

      return {
        anonymousLearnerId: `anon-${anonymousLearnerId}`,
        conceptId: item.conceptId || 'general-concept',
        evidenceType: item.evidenceType || 'ASSESSMENT',
        outcome: item.outcome ?? item.finalMastery ?? 0.0,
        timestampBucket,
      };
    });
  }

  /**
   * Registers a global anonymized learning pattern into the institutional knowledge registry.
   */
  async registerLearningPattern(
    patternKey: string,
    conceptScope: string,
    evidenceCount: number,
    confidence: number,
    effectiveness?: number,
  ) {
    const isValid = validatePattern(evidenceCount, confidence);
    const status = isValid ? 'VALIDATED' : 'CANDIDATE';

    const prismaClient = this.prisma as any;
    return prismaClient.learningPattern.upsert({
      where: { patternKey },
      create: {
        patternKey,
        conceptScope,
        evidenceCount,
        confidence,
        effectiveness: effectiveness ?? 0.85,
        sourceVersion: '1.0.0',
        status,
      },
      update: {
        evidenceCount,
        confidence,
        effectiveness: effectiveness ?? 0.85,
        status,
      },
    });
  }

  /**
   * Lists research datasets.
   */
  async listDatasets(filters: { status?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    return prismaClient.researchDataset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }
}
