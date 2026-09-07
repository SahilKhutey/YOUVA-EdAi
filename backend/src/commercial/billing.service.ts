import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPlan } from './commercial.constants';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  public stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key';
    this.stripe = new Stripe(key);
  }

  async createCheckoutSession(
    userId: string,
    plan: ProductPlan,
  ) {
    const priceMap: Record<string, string | undefined> = {
      FAMILY: process.env.STRIPE_PRICE_FAMILY,
      FAMILY_PLUS: process.env.STRIPE_PRICE_FAMILY_PLUS,
      SCHOOL: process.env.STRIPE_PRICE_SCHOOL,
      SCHOOL_ENTERPRISE: process.env.STRIPE_PRICE_SCHOOL_ENTERPRISE,
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      throw new InternalServerErrorException(
        `Stripe price is not configured for ${plan}.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new InternalServerErrorException('User not found.');
    }

    const account = await this.prisma.billingAccount.findUnique({
      where: { userId },
    });

    let customerId = account?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          userId,
        },
      });

      customerId = customer.id;

      await this.prisma.billingAccount.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session =
      await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url:
          `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          `${frontendUrl}/billing/cancelled`,
        metadata: {
          userId,
          plan,
        },
        subscription_data: {
          metadata: {
            userId,
            plan,
          },
        },
      });

    return {
      id: session.id,
      url: session.url,
    };
  }

  async processWebhook(
    rawBody: Buffer,
    signature: string,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder_secret';

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        secret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new InternalServerErrorException(`Webhook signature verification failed: ${err.message}`);
    }

    const existing =
      await this.prisma.billingEvent.findUnique({
        where: {
          providerEventId: event.id,
        },
      });

    if (existing?.processed) {
      return { received: true, duplicate: true };
    }

    await this.prisma.billingEvent.upsert({
      where: {
        providerEventId: event.id,
      },
      create: {
        provider: 'STRIPE',
        providerEventId: event.id,
        eventType: event.type,
        payload: JSON.stringify(event),
      },
      update: {},
    });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.created':
        case 'customer.subscription.deleted':
          await this.handleSubscription(
            event.data.object as Stripe.Subscription,
          );
          break;
      }

      await this.prisma.billingEvent.update({
        where: {
          providerEventId: event.id,
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return { received: true };
    } catch (error) {
      await this.prisma.billingEvent.update({
        where: {
          providerEventId: event.id,
        },
        data: {
          error:
            error instanceof Error
              ? error.message
              : 'Unknown error',
        },
      });

      throw error;
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const userId = session.metadata?.userId;

    if (!userId) {
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    await this.prisma.billingAccount.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId:
          typeof session.customer === 'string'
            ? session.customer
            : undefined,
        stripeSubscriptionId: subscriptionId,
      },
      update: {
        stripeCustomerId:
          typeof session.customer === 'string'
            ? session.customer
            : undefined,
        stripeSubscriptionId: subscriptionId,
      },
    });
  }

  private async handleSubscription(
    subscription: Stripe.Subscription,
  ) {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    const plan =
      subscription.metadata?.plan ?? ProductPlan.FAMILY;

    const status =
      subscription.status === 'active' ||
      subscription.status === 'trialing'
        ? 'ACTIVE'
        : subscription.status.toUpperCase();

    const periodEnd = subscription.items?.data?.[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan,
        status,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.billingAccount.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : undefined,
        stripeSubscriptionId: subscription.id,
      },
      update: {
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : undefined,
        stripeSubscriptionId: subscription.id,
      },
    });
  }
}
