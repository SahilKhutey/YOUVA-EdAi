import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as net from 'net';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const isPortOpen = await this.checkPortAvailable();
    if (!isPortOpen) {
      this.logger.warn('Database server is not reachable. Skipping eager Prisma connection.');
      return;
    }

    try {
      await this.$connect();
    } catch (err: any) {
      this.logger.warn(`Prisma could not connect on initialization: ${err.message}`);
    }
  }

  private checkPortAvailable(): Promise<boolean> {
    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/@([^:/]+):(\d+)/);
    const host = match ? match[1] : 'localhost';
    const port = match ? parseInt(match[2], 10) : 5432;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(400);

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
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Ignore disconnect error during shutdown
    }
  }
}
