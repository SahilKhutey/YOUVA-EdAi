import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EvolutionRolloutDto, RollbackPlanDto } from '../domain/evolution.types';
import { RollbackService } from '../rollout/rollback.service';
import { RolloutService } from '../rollout/rollout.service';

@Controller('api/v1/continuous-learning/rollouts')
export class RolloutController {
  constructor(
    private readonly rolloutService: RolloutService,
    private readonly rollbackService: RollbackService,
  ) {}

  @Post()
  async startRollout(
    @Body()
    body: {
      tenantId?: string;
      candidateId: string;
      targetType: string;
      targetId: string;
      rollbackPlan?: RollbackPlanDto;
    },
  ): Promise<EvolutionRolloutDto> {
    return this.rolloutService.startRollout(body);
  }

  @Get()
  async listRollouts(@Query('tenantId') tenantId?: string): Promise<EvolutionRolloutDto[]> {
    return this.rolloutService.listRollouts(tenantId);
  }

  @Get(':id')
  async getRollout(@Param('id') id: string): Promise<EvolutionRolloutDto> {
    return this.rolloutService.getRollout(id);
  }

  @Post(':id/advance')
  async advanceRollout(
    @Param('id') id: string,
    @Body('guardrailsSatisfied') guardrailsSatisfied?: boolean,
  ): Promise<EvolutionRolloutDto> {
    return this.rolloutService.advanceRollout(id, guardrailsSatisfied ?? true);
  }

  @Post(':id/pause')
  async pauseRollout(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<EvolutionRolloutDto> {
    return this.rolloutService.pauseRollout(id, reason);
  }

  @Post(':id/rollback')
  async rollback(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<EvolutionRolloutDto> {
    return this.rollbackService.executeRollback(id, reason);
  }
}
