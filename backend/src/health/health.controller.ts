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

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready() {
    return this.healthService.readiness();
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  async readiness() {
    return this.healthService.readiness();
  }

  @Get('dependencies')
  @HttpCode(HttpStatus.OK)
  async dependencies() {
    return {
      database: await this.healthService.database(),
      redis: await this.healthService.redis(),
      queue: await this.healthService.queue(),
      ai: await this.healthService.ai(),
      websocket: this.healthService.websocket(),
      timestamp: new Date().toISOString(),
    };
  }
}
