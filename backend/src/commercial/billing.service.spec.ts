import { BillingService } from './billing.service';
import { ProductPlan } from './commercial.constants';
import { InternalServerErrorException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let mockPrisma: any;

  beforeEach(() => {
    process.env.STRIPE_PRICE_FAMILY = 'price_family_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      billingAccount: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
      billingEvent: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      subscription: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    service = new BillingService(mockPrisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processWebhook Idempotency', () => {
    it('does not process the same webhook twice', async () => {
      // Mock Stripe constructEvent to return a valid event
      jest.spyOn(service.stripe.webhooks, 'constructEvent').mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      } as any);

      mockPrisma.billingEvent.findUnique.mockResolvedValue({
        id: 'event-db-1',
        providerEventId: 'evt_test_123',
        processed: true,
      });

      const result = await service.processWebhook(
        Buffer.from('{}'),
        'signature',
      );

      expect(result).toEqual({
        received: true,
        duplicate: true,
      });
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it('processes new webhook and marks event as processed', async () => {
      jest.spyOn(service.stripe.webhooks, 'constructEvent').mockReturnValue({
        id: 'evt_new_456',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_stripe_1',
            status: 'active',
            customer: 'cus_123',
            metadata: { userId: 'user-77', plan: 'FAMILY' },
            items: { data: [{ current_period_end: 1770000000 }] },
          },
        },
      } as any);

      mockPrisma.billingEvent.findUnique.mockResolvedValue(null);

      const result = await service.processWebhook(
        Buffer.from('{}'),
        'valid_signature',
      );

      expect(result).toEqual({ received: true });
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-77' },
        create: expect.objectContaining({
          userId: 'user-77',
          plan: 'FAMILY',
          status: 'ACTIVE',
        }),
        update: expect.objectContaining({
          plan: 'FAMILY',
          status: 'ACTIVE',
        }),
      });

      expect(mockPrisma.billingEvent.update).toHaveBeenCalledWith({
        where: { providerEventId: 'evt_new_456' },
        data: expect.objectContaining({ processed: true }),
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('throws error if Stripe price is not configured for plan', async () => {
      delete process.env.STRIPE_PRICE_SCHOOL_ENTERPRISE;

      await expect(
        service.createCheckoutSession('user-1', ProductPlan.SCHOOL_ENTERPRISE),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('creates customer and session for user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@youva.example',
        name: 'Parent Test',
      });
      mockPrisma.billingAccount.findUnique.mockResolvedValue(null);

      jest.spyOn(service.stripe.customers, 'create').mockResolvedValue({
        id: 'cus_new_123',
      } as any);

      jest.spyOn(service.stripe.checkout.sessions, 'create').mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      } as any);

      const session = await service.createCheckoutSession('user-1', ProductPlan.FAMILY);

      expect(session.id).toBe('cs_test_123');
      expect(session.url).toContain('checkout.stripe.com');
      expect(mockPrisma.billingAccount.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', stripeCustomerId: 'cus_new_123' },
        update: { stripeCustomerId: 'cus_new_123' },
      });
    });
  });
});
