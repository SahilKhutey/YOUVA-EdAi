import { EntitlementService } from './entitlement.service';
import {
  Entitlement,
  ProductPlan,
} from './commercial.constants';
import { ForbiddenException } from '@nestjs/common';

describe('EntitlementService', () => {
  let service: EntitlementService;

  beforeEach(() => {
    service = new EntitlementService();
  });

  it('grants basic learning to FREE', () => {
    expect(
      service.hasEntitlement(
        ProductPlan.FREE,
        Entitlement.BASIC_LEARNING,
      ),
    ).toBe(true);
  });

  it('does not grant AI tutor to FREE', () => {
    expect(
      service.hasEntitlement(
        ProductPlan.FREE,
        Entitlement.AI_TUTOR,
      ),
    ).toBe(false);
  });

  it('grants AI tutor to FAMILY', () => {
    expect(
      service.hasEntitlement(
        ProductPlan.FAMILY,
        Entitlement.AI_TUTOR,
      ),
    ).toBe(true);
  });

  it('grants school analytics to SCHOOL', () => {
    expect(
      service.hasEntitlement(
        ProductPlan.SCHOOL,
        Entitlement.SCHOOL_ANALYTICS,
      ),
    ).toBe(true);
  });

  it('falls back to FREE for an unknown plan', () => {
    expect(
      service.hasEntitlement(
        'INVALID',
        Entitlement.BASIC_LEARNING,
      ),
    ).toBe(true);

    expect(
      service.hasEntitlement(
        'INVALID',
        Entitlement.AI_TUTOR,
      ),
    ).toBe(false);
  });

  it('throws ForbiddenException when assertEntitlement fails', () => {
    expect(() =>
      service.assertEntitlement(ProductPlan.FREE, Entitlement.AI_TUTOR),
    ).toThrow(ForbiddenException);

    expect(() =>
      service.assertEntitlement(ProductPlan.FAMILY, Entitlement.AI_TUTOR),
    ).not.toThrow();
  });
});
