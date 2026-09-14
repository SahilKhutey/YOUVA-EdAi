import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityService } from './security.service';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { TieredRateLimitGuard } from './guards/rate-limit.guard';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { SsrfGuardService } from './ssrf/ssrf-guard.service';
import { AuditTamperService } from './interceptors/audit-tamper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    SecurityService,
    IdempotencyGuard,
    TieredRateLimitGuard,
    SsrfGuardService,
    AuditTamperService,
  ],
  exports: [
    SecurityService,
    IdempotencyGuard,
    TieredRateLimitGuard,
    SsrfGuardService,
    AuditTamperService,
  ],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
