import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  CommercialSubscriptionStatus,
  CommercialEntitlement,
} from './n14-types';
import * as crypto from 'crypto';

@Injectable()
export class CommercialBillingService {
  private readonly logger = new Logger(CommercialBillingService.name);
  private subscriptions: Map<string, CommercialEntitlement> = new Map();
  private processedWebhookEvents: Set<string> = new Set();
  private readonly webhookSigningSecret = 'whsec_prod_commercial_live_9944a';

  constructor() {
    this.seedDefaultSubscriptions();
  }

  private seedDefaultSubscriptions() {
    this.subscriptions.set('tenant-dps-rkp', {
      tenantId: 'tenant-dps-rkp',
      planId: 'INSTITUTIONAL_ENTERPRISE',
      status: 'ACTIVE',
      maxSeats: 500,
      activeLearnersCount: 320,
      seatsRemaining: 180,
      features: [
        'PRESCHOOL_SUITE',
        'ELEMENTARY_SUITE',
        'HIGHSCHOOL_CREDENTIALS',
        'AI_TUTOR',
        'TEACHER_ANALYTICS',
      ],
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    this.subscriptions.set('tenant-modern-vv', {
      tenantId: 'tenant-modern-vv',
      planId: 'SCHOOL_STANDARD',
      status: 'ACTIVE',
      maxSeats: 250,
      activeLearnersCount: 180,
      seatsRemaining: 70,
      features: ['ELEMENTARY_SUITE', 'AI_TUTOR', 'TEACHER_ANALYTICS'],
      currentPeriodEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // --- 1. Webhook Signature Verification & Idempotency (Clauses N14.32 - N14.33) ---

  public verifyAndProcessWebhook(params: {
    rawPayload: string;
    signatureHeader: string;
    timestampHeader: number;
    eventId: string;
    eventType: string;
    eventData: any;
  }): { processed: boolean; status: string } {
    // 1. Replay attack defense: Timestamp must be within 300 seconds
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - params.timestampHeader) > 300) {
      throw new BadRequestException('COM-004: Webhook timestamp expired / replay detected');
    }

    // 2. Cryptographic signature check
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSigningSecret)
      .update(`${params.timestampHeader}.${params.rawPayload}`)
      .digest('hex');

    const bufA = Buffer.from(params.signatureHeader, 'hex');
    const bufB = Buffer.from(expectedSignature, 'hex');

    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      throw new UnauthorizedException('COM-003: Invalid webhook cryptographic signature');
    }

    // 3. Idempotency Gate (Clause N14.31)
    if (this.processedWebhookEvents.has(params.eventId)) {
      this.logger.warn(`COM-002: Duplicate webhook [${params.eventId}] detected. Returning idempotent 200.`);
      return { processed: true, status: 'IDEMPOTENT_DUPLICATE_ACKNOWLEDGED' };
    }

    // 4. State mutation based on event
    if (params.eventType === 'customer.subscription.updated') {
      const { tenantId, planId, status, maxSeats } = params.eventData;
      this.updateSubscription(tenantId, planId, status, maxSeats);
    } else if (params.eventType === 'invoice.payment_failed') {
      const { tenantId } = params.eventData;
      this.handlePaymentFailed(tenantId);
    } else if (params.eventType === 'customer.subscription.deleted') {
      const { tenantId } = params.eventData;
      this.cancelSubscription(tenantId);
    }

    this.processedWebhookEvents.add(params.eventId);
    return { processed: true, status: 'PROCESSED_SUCCESS' };
  }

  // --- 2. Entitlement Enforcement (Clause N14.35) ---

  public getEntitlements(tenantId: string): CommercialEntitlement {
    const ent = this.subscriptions.get(tenantId);
    if (!ent) {
      return {
        tenantId,
        planId: 'FREE',
        status: 'ACTIVE',
        maxSeats: 10,
        activeLearnersCount: 0,
        seatsRemaining: 10,
        features: ['BASIC_EXPLORATION'],
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    return { ...ent };
  }

  public enrollLearnerInSeat(tenantId: string): { activeCount: number; remaining: number } {
    const ent = this.getEntitlements(tenantId);
    if (ent.status !== 'ACTIVE' && ent.status !== 'TRIAL') {
      throw new ForbiddenException(`COM-007: Subscription is in state [${ent.status}]. Cannot enroll.`);
    }

    if (ent.seatsRemaining <= 0) {
      throw new BadRequestException(`COM-010: Seat limit reached (${ent.maxSeats} max seats).`);
    }

    ent.activeLearnersCount += 1;
    ent.seatsRemaining = ent.maxSeats - ent.activeLearnersCount;
    this.subscriptions.set(tenantId, ent);

    return {
      activeCount: ent.activeLearnersCount,
      remaining: ent.seatsRemaining,
    };
  }

  public updateSubscription(
    tenantId: string,
    planId: any,
    status: CommercialSubscriptionStatus,
    maxSeats: number
  ): CommercialEntitlement {
    let ent = this.subscriptions.get(tenantId);
    if (!ent) {
      ent = {
        tenantId,
        planId,
        status,
        maxSeats,
        activeLearnersCount: 0,
        seatsRemaining: maxSeats,
        features: ['BASIC_EXPLORATION'],
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    ent.planId = planId;
    ent.status = status;
    ent.maxSeats = maxSeats;
    ent.seatsRemaining = Math.max(0, ent.maxSeats - ent.activeLearnersCount);

    if (planId === 'INSTITUTIONAL_ENTERPRISE') {
      ent.features = [
        'PRESCHOOL_SUITE',
        'ELEMENTARY_SUITE',
        'HIGHSCHOOL_CREDENTIALS',
        'AI_TUTOR',
        'TEACHER_ANALYTICS',
      ];
    }

    this.subscriptions.set(tenantId, ent);
    return ent;
  }

  public handlePaymentFailed(tenantId: string): CommercialEntitlement {
    const ent = this.getEntitlements(tenantId);
    ent.status = 'PAST_DUE';
    this.subscriptions.set(tenantId, ent);
    return ent;
  }

  public cancelSubscription(tenantId: string): CommercialEntitlement {
    const ent = this.getEntitlements(tenantId);
    ent.status = 'CANCELLED';
    ent.features = ['BASIC_EXPLORATION']; // Downgrade to baseline
    this.subscriptions.set(tenantId, ent);
    return ent;
  }
}
