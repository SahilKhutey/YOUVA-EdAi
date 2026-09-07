import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey =
      request.header('Idempotency-Key') || request.header('X-Idempotency-Key');

    if (!idempotencyKey) {
      // If mutation endpoint without idempotency key, let pass or enforce where required
      return true;
    }

    const bodyString = JSON.stringify(request.body || {});
    const requestHash = createHash('sha256').update(bodyString).digest('hex');
    const userId = request.user?.userId || request.user?.id || null;

    // Check if idempotency record exists
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new BadRequestException(
          'Idempotency key conflict: This key was already used with a different request payload.',
        );
      }

      if (existing.responseBody && existing.statusCode) {
        const response = context.switchToHttp().getResponse();
        response.status(existing.statusCode).json(JSON.parse(existing.responseBody));
        return false; // Request handled from cache
      }

      throw new ConflictException(
        'A request with this idempotency key is currently being processed.',
      );
    }

    // Attach idempotency metadata to request for post-processing
    request.idempotencyContext = {
      key: idempotencyKey,
      requestHash,
      userId,
    };

    return true;
  }
}
