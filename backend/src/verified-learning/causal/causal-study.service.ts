import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CausalStudyDto,
  InterventionEffectivenessDto,
} from './causal.types';

/**
 * Calculates Average Treatment Effect (ATE) between treatment and control outcomes.
 */
export function averageTreatmentEffect(
  treatmentOutcome: number,
  controlOutcome: number,
): number {
  return treatmentOutcome - controlOutcome;
}

@Injectable()
export class CausalStudyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a formalized causal research study with treatment, control, and confounder tracking.
   */
  async createStudy(dto: CausalStudyDto, approvedBy?: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.causalStudy.create({
      data: {
        hypothesis: dto.hypothesis,
        treatment: dto.treatment,
        control: dto.control,
        outcome: dto.outcome,
        populationJson: JSON.stringify(dto.population),
        confoundersJson: JSON.stringify(dto.confounders),
        design: dto.design,
        status: approvedBy ? 'APPROVED' : 'DRAFT',
        approvedBy,
        approvedAt: approvedBy ? new Date() : null,
      },
    });
  }

  /**
   * Retrieves single causal study by ID.
   */
  async getStudy(id: string) {
    const prismaClient = this.prisma as any;
    const study = await prismaClient.causalStudy.findUnique({ where: { id } });
    if (!study) {
      throw new NotFoundException(`Causal study '${id}' not found`);
    }
    return study;
  }

  /**
   * Records empirical intervention effectiveness observations.
   */
  async recordInterventionEffectiveness(dto: InterventionEffectivenessDto) {
    const prismaClient = this.prisma as any;
    const effectSize = dto.effectSize ?? (dto.postMastery - dto.baselineMastery);

    return prismaClient.interventionEffectiveness.create({
      data: {
        interventionType: dto.interventionType,
        conceptId: dto.conceptId,
        sampleSize: dto.sampleSize,
        baselineMastery: dto.baselineMastery,
        postMastery: dto.postMastery,
        retention: dto.retention,
        transfer: dto.transfer,
        effectSize: Number(effectSize.toFixed(4)),
        confidence: dto.confidence ?? 0.85,
      },
    });
  }

  /**
   * Retrieves aggregated effectiveness records for an intervention type.
   */
  async getInterventionEffectiveness(interventionType: string, conceptId?: string) {
    const prismaClient = this.prisma as any;
    const where: any = { interventionType };
    if (conceptId) where.conceptId = conceptId;

    return prismaClient.interventionEffectiveness.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Lists studies.
   */
  async listStudies(filters: { status?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    return prismaClient.causalStudy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });
  }
}
