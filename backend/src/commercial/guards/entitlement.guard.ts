import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementService } from '../entitlement.service';
import { REQUIRED_ENTITLEMENT } from '../decorators/requires-entitlement.decorator';
import { Entitlement } from '../commercial.constants';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Entitlement>(
      REQUIRED_ENTITLEMENT,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id || request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Authenticated user required.');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
      },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('Active subscription required.');
    }

    this.entitlementService.assertEntitlement(
      subscription.plan,
      required,
    );

    return true;
  }
}
