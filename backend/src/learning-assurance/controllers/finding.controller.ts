import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  AcknowledgeFindingDto,
  AssuranceDomain,
  AssuranceFindingDto,
  FindingSeverity,
  FindingStatus,
  ResolveFindingDto,
  WaiveFindingDto,
} from '../domain/assurance.types';
import { FindingService } from '../services/finding.service';

@Controller('api/v1/assurance/findings')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}

  @Get()
  async listFindings(
    @Query('tenantId') tenantId?: string,
    @Query('domain') domain?: AssuranceDomain,
    @Query('severity') severity?: FindingSeverity,
    @Query('status') status?: FindingStatus,
    @Query('targetType') targetType?: string,
  ): Promise<AssuranceFindingDto[]> {
    return this.findingService.listFindings({
      tenantId,
      domain,
      severity,
      status,
      targetType,
    });
  }

  @Get(':id')
  async getFinding(@Param('id') id: string): Promise<AssuranceFindingDto> {
    return this.findingService.getFinding(id);
  }

  @Post(':id/acknowledge')
  async acknowledgeFinding(
    @Param('id') id: string,
    @Body() dto: AcknowledgeFindingDto,
  ): Promise<AssuranceFindingDto> {
    return this.findingService.acknowledgeFinding(id, dto);
  }

  @Post(':id/resolve')
  async resolveFinding(
    @Param('id') id: string,
    @Body() dto: ResolveFindingDto,
  ): Promise<AssuranceFindingDto> {
    return this.findingService.resolveFinding(id, dto);
  }

  @Post(':id/waive')
  async waiveFinding(
    @Param('id') id: string,
    @Body() dto: WaiveFindingDto,
  ): Promise<AssuranceFindingDto> {
    return this.findingService.waiveFinding(id, dto);
  }
}
