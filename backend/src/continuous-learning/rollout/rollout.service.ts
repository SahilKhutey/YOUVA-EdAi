import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvolutionRolloutDto,
  RollbackPlanDto,
  RolloutStage,
} from '../domain/evolution.types';

@Injectable()
export class RolloutService {
  private readonly logger = new Logger(RolloutService.name);

  constructor(private readonly prisma: PrismaService) {}

  async startRollout(dto: {
    tenantId?: string;
    candidateId: string;
    targetType: string;
    targetId: string;
    rollbackPlan?: RollbackPlanDto;
  }): Promise<EvolutionRolloutDto> {
    const tenantId = dto.tenantId ?? 'default-tenant';

    const record = await this.prisma.evolutionRollout.create({
      data: {
        tenantId,
        candidateId: dto.candidateId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        currentStage: 'SHADOW',
        percentage: 0.0,
        status: 'ACTIVE',
        guardrailBreached: false,
        rollbackPlan: (dto.rollbackPlan ?? null) as any,
      },
    });

    this.logger.log(`Initiated canary rollout '${record.id}' for candidate '${dto.candidateId}' (Stage: SHADOW).`);

    return this.mapToDto(record);
  }

  async advanceRollout(id: string, guardrailsSatisfied = true): Promise<EvolutionRolloutDto> {
    const current = await this.getRollout(id);

    if (current.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot advance rollout in status '${current.status}'. Must be ACTIVE.`);
    }

    // Check Guardrails: If failed, PAUSE rollout immediately
    if (!guardrailsSatisfied) {
      const updated = await this.prisma.evolutionRollout.update({
        where: { id },
        data: {
          status: 'PAUSED',
          guardrailBreached: true,
          rollbackReason: 'Guardrail threshold exceeded during canary validation.',
        },
      });
      this.logger.warn(`Rollout '${id}' paused due to guardrail breach.`);
      throw new BadRequestException('Cannot advance rollout: Guardrail threshold exceeded. Rollout has been PAUSED.');
    }

    const stageMap: Record<RolloutStage, { nextStage: RolloutStage; pct: number; completed?: boolean }> = {
      SHADOW: { nextStage: 'CANARY_5', pct: 5.0 },
      CANARY_5: { nextStage: 'STAGE_15', pct: 15.0 },
      STAGE_15: { nextStage: 'STAGE_30', pct: 30.0 },
      STAGE_30: { nextStage: 'PRODUCTION_100', pct: 100.0, completed: true },
      PRODUCTION_100: { nextStage: 'PRODUCTION_100', pct: 100.0, completed: true },
    };

    const nextConfig = stageMap[current.currentStage];
    const newStatus = nextConfig.completed ? 'COMPLETED' : 'ACTIVE';

    const updated = await this.prisma.evolutionRollout.update({
      where: { id },
      data: {
        currentStage: nextConfig.nextStage,
        percentage: nextConfig.pct,
        status: newStatus,
      },
    });

    this.logger.log(`Advanced rollout '${id}' to stage '${nextConfig.nextStage}' (${nextConfig.pct}%).`);
    return this.mapToDto(updated);
  }

  async pauseRollout(id: string, reason?: string): Promise<EvolutionRolloutDto> {
    const updated = await this.prisma.evolutionRollout.update({
      where: { id },
      data: {
        status: 'PAUSED',
        rollbackReason: reason ?? 'Manual operator pause',
      },
    });

    this.logger.warn(`Rollout '${id}' paused.`);
    return this.mapToDto(updated);
  }

  async getRollout(id: string): Promise<EvolutionRolloutDto> {
    const record = await this.prisma.evolutionRollout.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Evolution rollout '${id}' not found.`);
    }
    return this.mapToDto(record);
  }

  async listRollouts(tenantId = 'default-tenant'): Promise<EvolutionRolloutDto[]> {
    const records = await this.prisma.evolutionRollout.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): EvolutionRolloutDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      candidateId: r.candidateId,
      targetType: r.targetType,
      targetId: r.targetId,
      currentStage: r.currentStage as RolloutStage,
      percentage: r.percentage,
      status: r.status as any,
      guardrailBreached: r.guardrailBreached,
      rollbackReason: r.rollbackReason,
      rollbackPlan: r.rollbackPlan as any,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
