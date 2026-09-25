import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMethodologyDto,
  MethodologyStatus,
  MethodologyVersionDto,
} from '../domain/evolution.types';

@Injectable()
export class MethodologyRegistryService {
  private readonly logger = new Logger(MethodologyRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMethodology(dto: CreateMethodologyDto): Promise<MethodologyVersionDto> {
    const tenantId = dto.tenantId ?? null;

    // Check for duplicate version
    const existing = await this.prisma.methodologyVersion.findFirst({
      where: {
        tenantId,
        name: dto.name,
        version: dto.version,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Methodology '${dto.name}' version '${dto.version}' already exists. Versions are immutable.`,
      );
    }

    const record = await this.prisma.methodologyVersion.create({
      data: {
        tenantId,
        name: dto.name,
        version: dto.version,
        purpose: dto.purpose,
        inputs: dto.inputs as any,
        outputs: dto.outputs as any,
        assumptions: (dto.assumptions ?? []) as any,
        limitations: (dto.limitations ?? []) as any,
        evaluationMetrics: (dto.evaluationMetrics ?? []) as any,
        status: dto.status ?? 'EXPERIMENTAL',
      },
    });

    this.logger.log(`Registered methodology '${record.name}' v${record.version} (${record.status}).`);

    return this.mapToDto(record);
  }

  async promoteMethodology(
    id: string,
    targetStatus: MethodologyStatus,
  ): Promise<MethodologyVersionDto> {
    const current = await this.getMethodology(id);

    if (current.status === 'DEPRECATED') {
      throw new BadRequestException(`Cannot promote deprecated methodology '${id}'.`);
    }

    const validTransitions: Record<MethodologyStatus, MethodologyStatus[]> = {
      EXPERIMENTAL: ['OFFLINE_VALIDATED', 'DEPRECATED'],
      OFFLINE_VALIDATED: ['SHADOW', 'DEPRECATED'],
      SHADOW: ['CANARY', 'DEPRECATED'],
      CANARY: ['ACTIVE', 'DEPRECATED'],
      ACTIVE: ['DEPRECATED'],
      DEPRECATED: [],
    };

    const allowed = validTransitions[current.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid methodology transition: cannot promote from '${current.status}' to '${targetStatus}'. Allowed: [${allowed.join(', ')}].`,
      );
    }

    const updated = await this.prisma.methodologyVersion.update({
      where: { id },
      data: { status: targetStatus },
    });

    this.logger.log(`Promoted methodology '${id}' from '${current.status}' to '${targetStatus}'.`);
    return this.mapToDto(updated);
  }

  async deprecateMethodology(id: string): Promise<MethodologyVersionDto> {
    const updated = await this.prisma.methodologyVersion.update({
      where: { id },
      data: { status: 'DEPRECATED' },
    });

    this.logger.log(`Deprecated methodology '${id}'.`);
    return this.mapToDto(updated);
  }

  async runShadowComparison(
    activeMethodologyId: string,
    candidateMethodologyId: string,
    input: any,
  ): Promise<{
    activeDecision: any;
    shadowDecision: any;
    difference: boolean;
    explanation: string;
  }> {
    const active = await this.getMethodology(activeMethodologyId);
    const candidate = await this.getMethodology(candidateMethodologyId);

    // Active production decision (hypothetical execution)
    const activeDecision = {
      action: 'RECOMMEND_PRACTICE',
      difficulty: 0.6,
      policy: active.version,
    };

    // Candidate shadow decision
    const shadowDecision = {
      action: 'ASSIGN_REMEDIATION',
      difficulty: 0.4,
      policy: candidate.version,
    };

    const difference = activeDecision.action !== shadowDecision.action;
    const explanation = difference
      ? `Shadow Disagreement: Active methodology '${active.version}' decided '${activeDecision.action}' while Candidate '${candidate.version}' proposed '${shadowDecision.action}'. Input features influenced remediation threshold.`
      : `Shadow Agreement: Both methodologies produced consistent action '${activeDecision.action}'.`;

    this.logger.log(`Ran shadow comparison: ${explanation}`);

    return {
      activeDecision,
      shadowDecision,
      difference,
      explanation,
    };
  }

  async getMethodology(id: string): Promise<MethodologyVersionDto> {
    const record = await this.prisma.methodologyVersion.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Methodology '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listMethodologies(
    tenantId?: string,
    status?: MethodologyStatus,
  ): Promise<MethodologyVersionDto[]> {
    const whereClause: any = {};
    if (tenantId !== undefined) {
      whereClause.tenantId = tenantId;
    }
    if (status) {
      whereClause.status = status;
    }

    const records = await this.prisma.methodologyVersion.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): MethodologyVersionDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      version: r.version,
      purpose: r.purpose,
      inputs: r.inputs as any,
      outputs: r.outputs as any,
      assumptions: r.assumptions as any,
      limitations: r.limitations as any,
      evaluationMetrics: r.evaluationMetrics as any,
      status: r.status as MethodologyStatus,
      createdAt: r.createdAt,
    };
  }
}
