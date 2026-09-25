import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class LkcCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LkcCacheService.name);
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(@Optional() private readonly configService?: ConfigService) {
    const redisUrl =
      this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.warn('Redis reconnection retries exhausted. Remaining on in-memory cache.');
              return null;
            }
            return Math.min(times * 200, 1000);
          },
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
        });

        this.redisClient.on('error', (err) => {
          this.logger.warn(`Redis connection error: ${err.message}. Falling back to in-memory cache.`);
          this.isRedisAvailable = false;
        });

        this.redisClient.on('connect', () => {
          this.logger.log('Redis cache connected successfully.');
          this.isRedisAvailable = true;
        });
      } catch (err: any) {
        this.logger.warn(`Redis initialization skipped: ${err.message}. Using in-memory cache.`);
      }
    }
  }

  async onModuleInit() {
    if (this.redisClient) {
      try {
        await this.redisClient.connect();
        this.isRedisAvailable = true;
      } catch (err: any) {
        this.logger.warn(
          `Redis initial connect failed: ${err.message}. Operating in in-memory cache mode.`,
        );
        this.isRedisAvailable = false;
      }
    }

    // Background TTL cleanup for in-memory cache every 60s
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60_000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        // Ignore shutdown errors
      }
    }
  }

  // ============================================================================
  // Standardized Tenant-Scoped Cache Key Generators
  // ============================================================================

  static knowledgeKey(
    tenantId: string,
    knowledgeId: string,
    version: number,
  ): string {
    return `tenant:${tenantId}:knowledge:${knowledgeId}:published:v${version}`;
  }

  static graphKey(
    tenantId: string,
    knowledgeId: string,
    revision: string | number,
  ): string {
    return `tenant:${tenantId}:graph:${knowledgeId}:prerequisites:${revision}`;
  }

  static analyticsKey(
    tenantId: string,
    learnerId: string,
    date: string,
  ): string {
    return `tenant:${tenantId}:analytics:learner:${learnerId}:daily:${date}`;
  }

  // ============================================================================
  // Cache Operations with Seamless In-Memory Fallback
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
        return null;
      } catch (err: any) {
        this.logger.warn(`Redis get failed for [${key}]: ${err.message}. Falling back to memory.`);
      }
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set failed for [${key}]: ${err.message}. Storing in memory.`);
      }
    }

    // In-memory storage
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis del failed for [${key}]: ${err.message}`);
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Invalidates all memory keys matching a prefix (useful on knowledge publish).
   */
  async invalidateKnowledge(tenantId: string, knowledgeId: string): Promise<void> {
    const prefix = `tenant:${tenantId}:knowledge:${knowledgeId}`;

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (err: any) {
        this.logger.warn(`Redis wildcard invalidation failed for [${prefix}]: ${err.message}`);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  isRedisConnected(): boolean {
    return this.isRedisAvailable;
  }

  getStats(): { isRedis: boolean; inMemoryEntries: number } {
    return {
      isRedis: this.isRedisAvailable,
      inMemoryEntries: this.memoryCache.size,
    };
  }
}
