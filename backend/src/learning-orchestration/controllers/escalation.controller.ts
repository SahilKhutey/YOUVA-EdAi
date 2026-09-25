import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  EscalationSeverity,
  EscalationStatus,
  LearningEscalationDto,
} from '../domain/orchestration.types';
import { EscalationService } from '../services/escalation.service';

@Controller('api/v1/learning-orchestration/escalations')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get()
  async listEscalations(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: EscalationStatus,
    @Query('severity') severity?: EscalationSeverity,
  ): Promise<LearningEscalationDto[]> {
    return this.escalationService.listEscalations({ tenantId, status, severity });
  }

  @Post(':id/acknowledge')
  async acknowledgeEscalation(
    @Param('id') id: string,
    @Body('acknowledgedBy') acknowledgedBy: string,
  ): Promise<LearningEscalationDto> {
    return this.escalationService.acknowledgeEscalation(id, acknowledgedBy);
  }

  @Post(':id/resolve')
  async resolveEscalation(
    @Param('id') id: string,
    @Body('resolvedBy') resolvedBy: string,
    @Body('notes') notes?: string,
  ): Promise<LearningEscalationDto> {
    return this.escalationService.resolveEscalation(id, resolvedBy, notes);
  }
}
