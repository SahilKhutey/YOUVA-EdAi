import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    // Default to localhost:6379 if not in env
    const redisHost =
      this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;

    this.client = new Redis({
      host: redisHost,
      port: redisPort,
      lazyConnect: true, // Don't connect immediately on instantiation
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Redis client connected');
    } catch (error) {
      this.logger.warn(
        `Failed to connect to Redis: ${error.message}. Caching will be disabled.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Redis Get Error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, stringValue, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Redis Set Error: ${error.message}`);
    }
  }
}
