import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ImprovementDiscoveryService } from '../discovery/improvement-discovery.service';
import {
  CandidateStatus,
  CreateImprovementCandidateDto,
  ImprovementCandidateDto,
} from '../domain/evolution.types';

@Controller('api/v1/continuous-learning/improvements')
export class ImprovementController {
  constructor(private readonly discoveryService: ImprovementDiscoveryService) {}

  @Post()
  async createCandidate(
    @Body() dto: CreateImprovementCandidateDto,
  ): Promise<ImprovementCandidateDto> {
    return this.discoveryService.createCandidate(dto);
  }

  @Get()
  async listCandidates(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: CandidateStatus,
  ): Promise<ImprovementCandidateDto[]> {
    return this.discoveryService.listCandidates(tenantId, status);
  }

  @Get(':id')
  async getCandidate(@Param('id') id: string): Promise<ImprovementCandidateDto> {
    return this.discoveryService.getCandidate(id);
  }

  @Post(':id/validate')
  async validateCandidate(@Param('id') id: string) {
    return this.discoveryService.validateCandidate(id);
  }

  @Post(':id/simulate')
  async simulateCandidate(@Param('id') id: string) {
    return this.discoveryService.simulateCandidate(id);
  }

  @Post(':id/approve')
  async approveCandidate(
    @Param('id') id: string,
    @Body('actorRole') actorRole?: string,
  ): Promise<ImprovementCandidateDto> {
    return this.discoveryService.approveCandidate(id, actorRole ?? 'ADMIN');
  }

  @Post(':id/reject')
  async rejectCandidate(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<ImprovementCandidateDto> {
    return this.discoveryService.rejectCandidate(id, reason);
  }
}
