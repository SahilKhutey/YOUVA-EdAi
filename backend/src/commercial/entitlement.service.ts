import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  Entitlement,
  PLAN_ENTITLEMENTS,
  ProductPlan,
} from './commercial.constants';

@Injectable()
export class EntitlementService {
  hasEntitlement(
    plan: string | null | undefined,
    entitlement: Entitlement,
  ): boolean {
    const normalizedPlan = plan as ProductPlan;

    const entitlements =
      PLAN_ENTITLEMENTS[normalizedPlan] ??
      PLAN_ENTITLEMENTS[ProductPlan.FREE];

    return entitlements.includes(entitlement);
  }

  assertEntitlement(
    plan: string | null | undefined,
    entitlement: Entitlement,
  ): void {
    if (!this.hasEntitlement(plan, entitlement)) {
      throw new ForbiddenException(
        `This feature requires the ${entitlement} entitlement.`,
      );
    }
  }

  getEntitlements(plan: string | null | undefined): Entitlement[] {
    const normalizedPlan = plan as ProductPlan;

    return (
      PLAN_ENTITLEMENTS[normalizedPlan] ??
      PLAN_ENTITLEMENTS[ProductPlan.FREE]
    );
  }
}
