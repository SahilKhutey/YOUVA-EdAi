import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready() {
    return this.healthService.readiness();
  }
}
