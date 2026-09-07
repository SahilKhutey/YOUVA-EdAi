import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvidenceCorrectionDto,
  EvidenceProvenanceDto,
} from './evidence.types';
import {
  EvidenceIntegrityService,
  hashCanonicalEvidence,
} from './evidence-integrity.service';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrityService: EvidenceIntegrityService,
  ) {}

  /**
   * Records immutable cryptographic provenance for a learning evidence event.
   */
  async recordProvenance(dto: EvidenceProvenanceDto) {
    const integrityHash = hashCanonicalEvidence(dto.evidencePayload);
    const prismaClient = this.prisma as any;

    return prismaClient.evidenceProvenance.create({
      data: {
        evidenceId: dto.evidenceId,
        tenantId: dto.tenantId,
        learnerId: dto.learnerId,
        conceptId: dto.conceptId,
        contentId: dto.contentId,
        curriculumId: dto.curriculumId,
        modelVersion: dto.modelVersion,
        agentVersion: dto.agentVersion,
        policyVersion: dto.policyVersion,
        teacherId: dto.teacherId,
        interventionId: dto.interventionId,
        experimentId: dto.experimentId,
        source: dto.source,
        integrityHash,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });
  }

  /**
   * Retrieves provenance metadata by evidence ID.
   */
  async getProvenance(evidenceId: string) {
    const prismaClient = this.prisma as any;
    const provenance = await prismaClient.evidenceProvenance.findUnique({
      where: { evidenceId },
    });

    if (!provenance) {
      throw new NotFoundException(`Evidence provenance '${evidenceId}' not found`);
    }
    return provenance;
  }

  /**
   * Requests a formal audit correction for evidence without mutating original records.
   */
  async requestCorrection(dto: EvidenceCorrectionDto, requestedBy: string) {
    const prismaClient = this.prisma as any;
    await this.getProvenance(dto.evidenceId);

    return prismaClient.evidenceCorrection.create({
      data: {
        evidenceId: dto.evidenceId,
        requestedBy,
        reason: dto.reason,
        replacementId: dto.replacementId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Resolves an evidence correction request.
   */
  async resolveCorrection(id: string, status: 'APPROVED' | 'REJECTED') {
    const prismaClient = this.prisma as any;
    const correction = await prismaClient.evidenceCorrection.findUnique({ where: { id } });
    if (!correction) {
      throw new NotFoundException(`Correction request '${id}' not found`);
    }

    return prismaClient.evidenceCorrection.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
      },
    });
  }
}
