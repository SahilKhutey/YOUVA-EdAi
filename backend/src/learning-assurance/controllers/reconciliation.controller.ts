import { Body, Controller, Post } from '@nestjs/common';
import {
  ReconciliationReport,
  RepairRequestDto,
  RepairResultDto,
} from '../domain/assurance.types';
import { ReconciliationService } from '../services/reconciliation.service';
import { RepairService } from '../services/repair.service';

@Controller('api/v1/assurance')
export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly repairService: RepairService,
  ) {}

  @Post('reconcile')
  async reconcile(
    @Body('target') target: 'KNOWLEDGE' | 'EVENTS' | 'ANALYTICS',
    @Body('tenantId') tenantId?: string,
  ): Promise<ReconciliationReport> {
    if (target === 'EVENTS') {
      return this.reconciliationService.reconcileEvents(tenantId);
    }
    if (target === 'ANALYTICS') {
      return this.reconciliationService.reconcileAnalytics(tenantId);
    }
    return this.reconciliationService.reconcileKnowledge(tenantId);
  }

  @Post('repair')
  async executeRepair(@Body() dto: RepairRequestDto): Promise<RepairResultDto> {
    return this.repairService.executeRepair(dto);
  }
}
