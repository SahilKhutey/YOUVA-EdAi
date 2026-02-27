import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException(
        'User must be authenticated to access this feature',
      );
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (
      !subscription ||
      subscription.plan !== 'PREMIUM' ||
      subscription.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'This feature requires an active Premium subscription',
      );
    }

    // Additional check if the subscription is past due or expired based on currentPeriodEnd
    if (
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd < new Date()
    ) {
      throw new ForbiddenException('Your Premium subscription has expired');
    }

    return true;
  }
}
