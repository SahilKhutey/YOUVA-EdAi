import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

const event = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: { id: 'cs_1', object: 'checkout.session', client_reference_id: 'victim-user' } } });

function setup() {
  const prisma: any = { subscription: { upsert: jest.fn(async () => ({})) } };
  return { prisma, svc: new SubscriptionService(prisma) };
}

describe('Stripe webhook security', () => {
  const OLD = process.env.STRIPE_WEBHOOK_SECRET;
  afterEach(() => { if (OLD === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = OLD; });

  it('is disabled when no signing secret is set (it used to trust unsigned JSON)', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { svc, prisma } = setup();
    await expect(svc.handleStripeWebhook('anything', Buffer.from(event))).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('rejects a forged event with a bad signature and grants nothing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    const { svc, prisma } = setup();
    await expect(svc.handleStripeWebhook('t=1,v1=deadbeef', Buffer.from(event))).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it('still processes a correctly signed event', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    const { svc, prisma } = setup();
    const header = (svc as any).stripe.webhooks.generateTestHeaderString({ payload: event, secret: 'whsec_test_secret' });
    await svc.handleStripeWebhook(header, Buffer.from(event));
    expect(prisma.subscription.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.upsert.mock.calls[0][0].where).toEqual({ userId: 'victim-user' });
  });
});
