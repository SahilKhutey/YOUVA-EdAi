import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReliabilityService } from './reliability.service';
import { CorrelationContext, ReliabilityAction } from './reliability.types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller(['v1/learning-os/reliability', 'learning-os/reliability'])
export class ReliabilityController {
  constructor(private readonly reliabilityService: ReliabilityService) {}

  @Get('health')
  async getHealth() {
    return this.reliabilityService.getHealthStatus();
  }

  @Post('actions')
  @UseGuards(JwtAuthGuard)
  async executeRemediation(
    @Body()
    body: {
      action: ReliabilityAction;
      targetResource: string;
      correlation?: CorrelationContext;
    },
  ) {
    return this.reliabilityService.triggerRemediation(
      body.action,
      body.targetResource,
      body.correlation,
    );
  }
}
