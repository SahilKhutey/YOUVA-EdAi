import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class TieredRateLimitGuard implements CanActivate {
  private readonly clients = new Map<string, RateLimitBucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isAiRoute = request.originalUrl?.includes('/ai') || request.originalUrl?.includes('/chat');
    const isAuthRoute = request.originalUrl?.includes('/auth/login');
    const clientIp = request.ip || request.headers['x-forwarded-for'] || '127.0.0.1';
    const userId = request.user?.id || request.user?.userId;

    const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;
    const windowMs = 60_000; // 1 minute
    const limit = isAuthRoute ? 10 : isAiRoute ? 20 : userId ? 120 : 60;

    const now = Date.now();
    const bucket = this.clients.get(identifier);

    if (!bucket || now > bucket.resetAt) {
      this.clients.set(identifier, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (bucket.count >= limit) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Rate limit exceeded for tier (${limit} req/min). Please retry in ${retryAfterSeconds}s.`,
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }
}
