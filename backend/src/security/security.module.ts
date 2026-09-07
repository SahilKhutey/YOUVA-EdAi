import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityService } from './security.service';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { TieredRateLimitGuard } from './guards/rate-limit.guard';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SecurityService, IdempotencyGuard, TieredRateLimitGuard],
  exports: [SecurityService, IdempotencyGuard, TieredRateLimitGuard],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
