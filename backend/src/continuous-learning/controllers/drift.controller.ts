import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DriftDetectionService } from '../drift/drift-detection.service';
import { DriftType, LearningDriftSignalDto } from '../domain/evolution.types';

@Controller('api/v1/continuous-learning/drift')
export class DriftController {
  constructor(private readonly driftService: DriftDetectionService) {}

  @Post('detect')
  async detectDrift(
    @Body()
    body: {
      tenantId?: string;
      targetType: string;
      targetId: string;
      baselineDistribution: Record<string, number>;
      currentDistribution: Record<string, number>;
      driftType?: DriftType;
      evidenceIds?: string[];
    },
  ): Promise<LearningDriftSignalDto | null> {
    return this.driftService.detectDrift(body);
  }

  @Get()
  async listDriftSignals(
    @Query('tenantId') tenantId?: string,
    @Query('driftType') driftType?: DriftType,
  ): Promise<LearningDriftSignalDto[]> {
    return this.driftService.listDriftSignals(tenantId, driftType);
  }

  @Get(':id')
  async getDriftSignal(@Param('id') id: string): Promise<LearningDriftSignalDto> {
    return this.driftService.getDriftSignal(id);
  }
}
