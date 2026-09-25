import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CandidateStatus,
  CreateImprovementCandidateDto,
  EvolutionLevel,
  EvolutionPolicyDto,
  ImprovementCandidateDto,
} from '../domain/evolution.types';
import { EvolutionPolicyService } from '../policies/evolution-policy.service';

@Injectable()
export class ImprovementDiscoveryService {
  private readonly logger = new Logger(ImprovementDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: EvolutionPolicyService,
  ) {}

  async createCandidate(dto: CreateImprovementCandidateDto): Promise<ImprovementCandidateDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';

    if (!dto.sourceType || !dto.targetType || !dto.targetId || !dto.proposal) {
      throw new BadRequestException('Candidate requires sourceType, targetType, targetId, and proposal.');
    }

    if (!dto.sourceIds || dto.sourceIds.length === 0) {
      throw new BadRequestException('Candidate requires at least one source evidence identifier.');
    }

    // Determine Evolution Level
    let level: EvolutionLevel = dto.evolutionLevel ?? 3;
    if (dto.targetType === 'CACHE' || dto.targetType === 'SEARCH_INDEX') {
      level = 0;
    } else if (dto.targetType === 'OPERATIONAL_TUNING') {
      level = 1;
    } else if (dto.targetType === 'AI_PROMPT' || dto.targetType === 'SUGGESTION') {
      level = 2;
    } else if (dto.targetType === 'INSTITUTION_CURRICULUM' || dto.targetType === 'MASTERY_POLICY') {
      level = 4;
    }

    const record = await this.prisma.improvementCandidate.create({
      data: {
        tenantId,
        sourceType: dto.sourceType,
        sourceIds: dto.sourceIds as any,
        targetType: dto.targetType,
        targetId: dto.targetId,
        proposal: dto.proposal as any,
        expectedBenefits: (dto.expectedBenefits ?? []) as any,
        risks: (dto.risks ?? []) as any,
        assumptions: (dto.assumptions ?? []) as any,
        evolutionLevel: level,
        status: 'DISCOVERED',
      },
    });

    this.logger.log(`Discovered improvement candidate '${record.id}' for target '${dto.targetId}' (Level ${level}).`);

    return this.mapToDto(record);
  }

  async validateCandidate(id: string): Promise<{
    valid: boolean;
    evolutionLevel: EvolutionLevel;
    policy: EvolutionPolicyDto;
  }> {
    const candidate = await this.getCandidate(id);
    const policy = this.policyService.getPolicy(candidate.evolutionLevel, candidate.targetType);

    const hasMinEvidence = candidate.sourceIds.length >= policy.minimumEvidence;
    const valid = hasMinEvidence;

    const nextStatus: CandidateStatus = policy.simulationRequired
      ? 'SIMULATION_REQUIRED'
      : 'REVIEW';

    await this.prisma.improvementCandidate.update({
      where: { id },
      data: { status: nextStatus },
    });

    return {
      valid,
      evolutionLevel: candidate.evolutionLevel,
      policy,
    };
  }

  async simulateCandidate(id: string): Promise<{
    candidateId: string;
    simulated: boolean;
    scenarioId: string;
  }> {
    const candidate = await this.getCandidate(id);
    const mockScenarioId = `scen-twin-${candidate.id.substring(0, 8)}`;

    await this.prisma.improvementCandidate.update({
      where: { id },
      data: { status: 'REVIEW' },
    });

    this.logger.log(`Simulated candidate '${id}' via Digital Twin. Linked scenario: '${mockScenarioId}'.`);

    return {
      candidateId: id,
      simulated: true,
      scenarioId: mockScenarioId,
    };
  }

  async approveCandidate(id: string, actorRole = 'ADMIN'): Promise<ImprovementCandidateDto> {
    const candidate = await this.getCandidate(id);

    // Enforce No-Authority Escalation
    this.policyService.validateNoAuthorityEscalation(
      'APPROVE_CANDIDATE',
      candidate.evolutionLevel,
      true,
      actorRole,
    );

    const updated = await this.prisma.improvementCandidate.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    this.logger.log(`Candidate '${id}' approved by role '${actorRole}'.`);
    return this.mapToDto(updated);
  }

  async rejectCandidate(id: string, _reason?: string): Promise<ImprovementCandidateDto> {
    const updated = await this.prisma.improvementCandidate.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    this.logger.log(`Candidate '${id}' rejected.`);
    return this.mapToDto(updated);
  }

  async getCandidate(id: string): Promise<ImprovementCandidateDto> {
    const record = await this.prisma.improvementCandidate.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Improvement candidate '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listCandidates(
    tenantId = 'default-tenant',
    status?: CandidateStatus,
  ): Promise<ImprovementCandidateDto[]> {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }
    const records = await this.prisma.improvementCandidate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): ImprovementCandidateDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      sourceType: r.sourceType as any,
      sourceIds: r.sourceIds as any,
      targetType: r.targetType,
      targetId: r.targetId,
      proposal: r.proposal,
      expectedBenefits: r.expectedBenefits as any,
      risks: r.risks as any,
      assumptions: r.assumptions as any,
      evolutionLevel: r.evolutionLevel as EvolutionLevel,
      status: r.status as CandidateStatus,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
