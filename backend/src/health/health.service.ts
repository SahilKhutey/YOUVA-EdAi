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

  async queue(): Promise<{
    status: 'up' | 'degraded' | 'down';
    pendingDepth: number;
    deadLetterCount: number;
  }> {
    try {
      const prismaAny = this.prisma as any;
      if (!prismaAny.outboxEvent?.count) {
        return { status: 'up', pendingDepth: 0, deadLetterCount: 0 };
      }

      const pendingDepth = await prismaAny.outboxEvent.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      });
      const deadLetterCount = await prismaAny.outboxEvent.count({
        where: { status: 'DEAD_LETTER' },
      });

      const isDegraded = deadLetterCount > 50 || pendingDepth > 1000;
      return {
        status: isDegraded ? 'degraded' : 'up',
        pendingDepth,
        deadLetterCount,
      };
    } catch {
      return { status: 'down', pendingDepth: 0, deadLetterCount: 0 };
    }
  }

  async ai(): Promise<{
    status: 'up' | 'degraded' | 'isolated_non_blocking';
    primaryProvider: string;
    fallbackAvailable: boolean;
  }> {
    const provider = process.env.AI_PROVIDER || 'gemini';
    const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY);

    return {
      status: hasKey ? 'up' : 'isolated_non_blocking',
      primaryProvider: provider,
      fallbackAvailable: true,
    };
  }

  websocket(): { status: 'up' | 'down'; activeConnections: number } {
    return {
      status: 'up',
      activeConnections: 0,
    };
  }

  async readiness() {
    const dbHealth = await this.database();
    const redisHealth = await this.redis();
    const queueHealth = await this.queue();
    const aiHealth = await this.ai();
    const wsHealth = this.websocket();

    const isDbReady = dbHealth.status === 'up';
    const isRedisReady = redisHealth.status === 'up' || redisHealth.status === 'not_configured';

    return {
      status: isDbReady && isRedisReady ? 'ready' : 'not_ready',
      database: dbHealth,
      redis: redisHealth,
      queue: queueHealth,
      ai: aiHealth,
      websocket: wsHealth,
      config: { status: 'valid' },
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
