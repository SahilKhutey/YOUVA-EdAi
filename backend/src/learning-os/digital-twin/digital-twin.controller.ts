import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DigitalTwinService } from './digital-twin.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['v1/learning-os/twin', 'learning-os/twin'])
export class DigitalTwinController {
  constructor(private readonly digitalTwinService: DigitalTwinService) {}

  @Get('snapshot')
  @UseGuards(JwtAuthGuard)
  async getSnapshot(@Query('tenantId') tenantId?: string) {
    return this.digitalTwinService.getTwinSnapshot(tenantId);
  }
}
