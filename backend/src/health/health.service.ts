import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async database(): Promise<{ status: 'up' | 'down'; latencyMs?: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'down',
      };
    }
  }

  async readiness() {
    const dbHealth = await this.database();

    return {
      status: dbHealth.status === 'up' ? 'ready' : 'not_ready',
      database: dbHealth,
      timestamp: new Date().toISOString(),
    };
  }

  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
