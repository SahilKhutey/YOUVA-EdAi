import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PLAN_ENTITLEMENTS,
  ProductPlan,
} from './commercial.constants';

@Injectable()
export class CommercialService {
  constructor(private readonly prisma: PrismaService) {}

  getPlans() {
    return Object.values(ProductPlan).map((plan) => ({
      plan,
      entitlements: PLAN_ENTITLEMENTS[plan],
    }));
  }

  async getEntitlements(userId: string) {
    const subscription =
      await this.prisma.subscription.findUnique({
        where: { userId },
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
        },
      });

    const plan =
      subscription?.status === 'ACTIVE'
        ? subscription.plan
        : ProductPlan.FREE;

    return {
      plan,
      status: subscription?.status ?? 'ACTIVE',
      currentPeriodEnd:
        subscription?.currentPeriodEnd ?? null,
      entitlements:
        PLAN_ENTITLEMENTS[plan as ProductPlan] ??
        PLAN_ENTITLEMENTS[ProductPlan.FREE],
    };
  }
}
