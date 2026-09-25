import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateExperimentDto,
  ExperimentStatus,
  LearningExperimentDto,
} from '../domain/evolution.types';
import { ExperimentService } from '../experiments/experiment.service';

@Controller('api/v1/continuous-learning/experiments')
export class ExperimentController {
  constructor(private readonly experimentService: ExperimentService) {}

  @Post()
  async createExperiment(
    @Body() dto: CreateExperimentDto,
  ): Promise<LearningExperimentDto> {
    return this.experimentService.createExperiment(dto);
  }

  @Get()
  async listExperiments(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: ExperimentStatus,
  ): Promise<LearningExperimentDto[]> {
    return this.experimentService.listExperiments(tenantId, status);
  }

  @Get(':id')
  async getExperiment(@Param('id') id: string): Promise<LearningExperimentDto> {
    return this.experimentService.getExperiment(id);
  }

  @Post(':id/start')
  async startExperiment(
    @Param('id') id: string,
    @Body('actorRole') actorRole?: string,
  ): Promise<LearningExperimentDto> {
    return this.experimentService.startExperiment(id, actorRole);
  }

  @Post(':id/pause')
  async pauseExperiment(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<LearningExperimentDto> {
    return this.experimentService.pauseExperiment(id, reason);
  }

  @Post(':id/stop')
  async stopExperiment(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<LearningExperimentDto> {
    return this.experimentService.stopExperiment(id, reason);
  }

  @Post(':id/complete')
  async completeExperiment(@Param('id') id: string): Promise<LearningExperimentDto> {
    return this.experimentService.completeExperiment(id);
  }

  @Post(':id/guardrails/evaluate')
  async evaluateGuardrails(
    @Param('id') id: string,
    @Body('currentMetrics') currentMetrics: Record<string, number>,
  ) {
    return this.experimentService.evaluateGuardrails(id, currentMetrics);
  }
}
