import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApproveOrchestrationDto,
  KillSwitchStatusDto,
  LearningOrchestrationDto,
  TriggerOrchestrationDto,
} from '../domain/orchestration.types';
import { AutonomyPolicy } from '../policies/autonomy-policy';
import { EcosystemOrchestratorService } from '../services/ecosystem-orchestrator.service';

@Controller('api/v1/learning-orchestration')
export class EcosystemOrchestrationController {
  constructor(
    private readonly orchestratorService: EcosystemOrchestratorService,
    private readonly autonomyPolicy: AutonomyPolicy,
  ) {}

  @Post()
  async triggerOrchestration(
    @Body() dto: TriggerOrchestrationDto,
  ): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.triggerOrchestration(dto);
  }

  @Get()
  async listOrchestrations(
    @Query('tenantId') tenantId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('status') status?: string,
    @Query('autonomyLevel') autonomyLevel?: string,
  ): Promise<LearningOrchestrationDto[]> {
    return this.orchestratorService.listOrchestrations({
      tenantId,
      learnerId,
      status,
      autonomyLevel,
    });
  }

  @Get('kill-switch')
  getKillSwitchStatus(): KillSwitchStatusDto {
    return this.autonomyPolicy.getKillSwitchStatus();
  }

  @Post('kill-switch')
  setKillSwitch(
    @Body() body: { enabled: boolean; updatedBy?: string },
  ): KillSwitchStatusDto {
    return this.autonomyPolicy.setAutomationEnabled(body.enabled, body.updatedBy);
  }

  @Get(':id')
  async getOrchestration(@Param('id') id: string): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.getOrchestration(id);
  }

  @Post(':id/approve')
  async approveOrchestration(
    @Param('id') id: string,
    @Body() dto: ApproveOrchestrationDto,
  ): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.approveOrchestration(id, dto);
  }

  @Post(':id/pause')
  async pauseOrchestration(@Param('id') id: string): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.pauseOrchestration(id);
  }

  @Post(':id/resume')
  async resumeOrchestration(@Param('id') id: string): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.resumeOrchestration(id);
  }

  @Post(':id/cancel')
  async cancelOrchestration(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<LearningOrchestrationDto> {
    return this.orchestratorService.cancelOrchestration(id, reason);
  }
}
