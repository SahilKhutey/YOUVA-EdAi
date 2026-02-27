import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private prisma: PrismaService) {
    // In a real app, inject ConfigService and get STRIPE_SECRET_KEY
    // Using a dummy key for local testing out-of-the-box
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16' as any, // Using a stable version string, casting to any if types complain
    });
  }

  async createCheckoutSession(userId: string, plan: string) {
    try {
      // Create a Stripe Checkout Session
      // We use dummy prices here. In production, 'plan' would map to a real Stripe Price ID.
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Youva-EdAi ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                description: 'Unlock advanced AI tutoring and mock tests.',
              },
              unit_amount: plan === 'premium' ? 999 : 1999, // $9.99 for premium, else $19.99
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription?upgrade=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription?upgrade=canceled`,
        client_reference_id: userId, // CRITICAL: This is how we link the webhook back to the user
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe checkout session', error);
      // Fallback to mock URL if Stripe fails (e.g., dummy key used)
      return {
        url: `http://localhost:3000/dashboard/subscription?upgrade=success&mock=true`,
        sessionId: `mock_session_${Date.now()}`,
      };
    }
  }

  async handleStripeWebhook(signature: string, payload: Buffer) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

      let event: Stripe.Event;
      try {
        event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          webhookSecret,
        );
      } catch (err) {
        this.logger.error(
          `Webhook signature verification failed: ${err.message}`,
        );
        // If dummy key, bypass verification for local testing purposes
        if (webhookSecret === 'whsec_dummy') {
          event = JSON.parse(payload.toString());
        } else {
          throw new Error(`Webhook Error: ${err.message}`);
        }
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (userId) {
          await this.prisma.subscription.upsert({
            where: { userId },
            update: {
              status: 'ACTIVE',
              plan: 'PREMIUM', // Assuming any completed checkout is premium for now
              currentPeriodEnd: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1),
              ), // 1 year
            },
            create: {
              userId,
              plan: 'PREMIUM',
              status: 'ACTIVE',
              currentPeriodEnd: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1),
              ),
            },
          });
          this.logger.log(`Subscription updated for user ${userId}`);
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      throw error;
    }
  }

  async handleMockSuccess(userId: string, plan: string) {
    // Upsert subscription
    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ), // 1 year
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
      },
    });
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }
}
