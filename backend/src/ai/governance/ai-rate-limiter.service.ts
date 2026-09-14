import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface RateRecord {
  timestamps: number[];
}

@Injectable()
export class AiRateLimiterService {
  private readonly userLimits = new Map<string, RateRecord>();
  private readonly tenantLimits = new Map<string, RateRecord>();

  // Default limits: 30 req/min per user, 500 req/min per tenant
  private readonly USER_MAX_PER_MINUTE = 30;
  private readonly TENANT_MAX_PER_MINUTE = 500;
  private readonly WINDOW_MS = 60 * 1000;

  /**
   * Checks and updates the rate limit window for the actor and tenant.
   * Throws 429 Too Many Requests if either ceiling is breached.
   */
  checkRateLimit(tenantId: string, actorId: string, customLimit?: number): void {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;

    // 1. Check User Rate Limit
    const userMax = customLimit || this.USER_MAX_PER_MINUTE;
    let userRecord = this.userLimits.get(actorId);
    if (!userRecord) {
      userRecord = { timestamps: [] };
      this.userLimits.set(actorId, userRecord);
    }
    userRecord.timestamps = userRecord.timestamps.filter((t) => t > windowStart);
    if (userRecord.timestamps.length >= userMax) {
      throw new HttpException(
        `AiRateLimitExceeded: User ${actorId} exceeded limit of ${userMax} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Check Tenant Rate Limit
    let tenantRecord = this.tenantLimits.get(tenantId);
    if (!tenantRecord) {
      tenantRecord = { timestamps: [] };
      this.tenantLimits.set(tenantId, tenantRecord);
    }
    tenantRecord.timestamps = tenantRecord.timestamps.filter((t) => t > windowStart);
    if (tenantRecord.timestamps.length >= this.TENANT_MAX_PER_MINUTE) {
      throw new HttpException(
        `AiRateLimitExceeded: Tenant ${tenantId} exceeded limit of ${this.TENANT_MAX_PER_MINUTE} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Register consumption
    userRecord.timestamps.push(now);
    tenantRecord.timestamps.push(now);
  }

  /**
   * Reset rate counters (primarily for testing and mock runs).
   */
  resetLimits(): void {
    this.userLimits.clear();
    this.tenantLimits.clear();
  }
}
