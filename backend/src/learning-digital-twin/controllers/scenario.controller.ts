import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ScenarioComparisonService } from '../comparison/scenario-comparison.service';
import {
  CreateScenarioDto,
  LearningScenarioDto,
  ScenarioComparisonDto,
  ScenarioStatus,
  SimulationResultDto,
} from '../domain/twin.types';
import { ScenarioService } from '../scenarios/scenario.service';

@Controller('api/v1/learning-twin/scenarios')
export class ScenarioController {
  constructor(
    private readonly scenarioService: ScenarioService,
    private readonly comparisonService: ScenarioComparisonService,
  ) {}

  @Post()
  async createScenario(@Body() dto: CreateScenarioDto): Promise<LearningScenarioDto> {
    return this.scenarioService.createScenario(dto);
  }

  @Get()
  async listScenarios(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: ScenarioStatus,
  ): Promise<LearningScenarioDto[]> {
    return this.scenarioService.listScenarios(tenantId, status);
  }

  @Get(':id')
  async getScenario(@Param('id') id: string): Promise<LearningScenarioDto> {
    return this.scenarioService.getScenario(id);
  }

  @Post(':id/simulate')
  async simulateScenario(
    @Param('id') id: string,
    @Body('actorRole') actorRole?: string,
  ): Promise<SimulationResultDto> {
    return this.scenarioService.simulateScenario(id, actorRole);
  }

  @Post('compare')
  async compareScenarios(
    @Body() body: { baselineScenarioId: string; scenarioId: string },
  ): Promise<ScenarioComparisonDto> {
    return this.comparisonService.compareScenarios(
      body.baselineScenarioId,
      body.scenarioId,
    );
  }

  @Post(':id/approve')
  async approveScenario(
    @Param('id') id: string,
    @Body('actorRole') actorRole?: string,
  ): Promise<LearningScenarioDto> {
    return this.scenarioService.approveScenario(id, actorRole);
  }

  @Post(':id/reject')
  async rejectScenario(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<LearningScenarioDto> {
    return this.scenarioService.rejectScenario(id, reason);
  }

  @Post(':id/archive')
  async archiveScenario(@Param('id') id: string): Promise<LearningScenarioDto> {
    return this.scenarioService.archiveScenario(id);
  }
}
