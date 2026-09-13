import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

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

  async redis(): Promise<{ status: 'up' | 'down' | 'not_configured'; latencyMs?: number }> {
    const redisUrl = this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;
    if (!redisUrl) {
      return { status: 'not_configured' };
    }

    try {
      const net = await import('net');
      const parsed = new URL(redisUrl);
      const port = Number(parsed.port) || 6379;
      const host = parsed.hostname || 'localhost';

      const start = Date.now();
      const connected = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(500);
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.on('error', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(port, host);
      });

      return connected
        ? { status: 'up', latencyMs: Date.now() - start }
        : { status: 'down' };
    } catch {
      return { status: 'down' };
    }
  }

  async readiness() {
    const dbHealth = await this.database();
    const redisHealth = await this.redis();

    const isDbReady = dbHealth.status === 'up';
    const isRedisReady = redisHealth.status === 'up' || redisHealth.status === 'not_configured';

    return {
      status: isDbReady && isRedisReady ? 'ready' : 'not_ready',
      database: dbHealth,
      redis: redisHealth,
      config: { status: 'valid' },
      ai: {
        status: 'isolated_non_blocking',
        fallbackAvailable: true,
      },
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
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
